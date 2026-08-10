import type { AgentWorkflowRun } from "@app/api/agentic/contract";
import {
  APPLICATION_LABEL,
  invalidTargetBranchReason,
} from "@app/api/agentic/contract";
import type { Application } from "@app/api/models";

/** kubectl-style compact age: 45s, 12m, 3h, 2d. */
export function formatAge(creationTimestamp?: string): string {
  if (!creationTimestamp) return "-";
  const ms = Date.now() - new Date(creationTimestamp).getTime();
  if (ms < 0) return "0s";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function formatDuration(seconds?: number): string {
  if (seconds == null) return "-";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

/** Workflow-run status has no duration field — derive it from timestamps. */
export function workflowRunDuration(run: AgentWorkflowRun): number | undefined {
  const start = run.status?.startTime;
  if (!start) return undefined;
  const end = run.status?.completionTime;
  const ms = (end ? Date.parse(end) : Date.now()) - Date.parse(start);
  return ms >= 0 ? Math.round(ms / 1000) : undefined;
}

export function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max - 1) + "…";
}

// ------------------------------------------- application <-> run label

/** The label value runs carry: hub application id as a string. */
export const applicationLabelValue = (app: Application): string =>
  String(app.id);

/** True when `run` belongs to `app` via the konveyor.io/application label. */
export const runBelongsToApplication = (
  run: { metadata: { labels?: Record<string, string> } },
  appId: number
): boolean => run.metadata.labels?.[APPLICATION_LABEL] === String(appId);

// ------------------------------------------------- run eligibility

/**
 * The subset of an application these checks need. Kept structural (rather
 * than importing `Application` directly) so this module's run-eligibility
 * helpers stay decoupled from the hub model shape.
 */
export interface RunnableApplication {
  name?: string;
  repository?: { url?: string; branch?: string };
}

/**
 * Why a run cannot be created for an application. Structural rather than a
 * message so callers own their own wording — a modal renders one of these
 * inline, while a bulk caller lists them as exclusions.
 */
export type RunBlocker =
  | { kind: "noRepository" }
  | { kind: "branchInvalid"; detail: string }
  | { kind: "branchMatchesSource"; branch: string };

/**
 * Why no run can target this application, regardless of agent or branch. The
 * harness clones from the Hub record, so an application with no repository
 * URL dooms every stage before it starts.
 */
export function applicationRunBlocker(
  app: RunnableApplication
): RunBlocker | undefined {
  return app.repository?.url ? undefined : { kind: "noRepository" };
}

/**
 * Why `branch` cannot be this application's target branch. Mirrors what the
 * shim re-validates on create: a valid git refname that differs from the
 * source branch (the harness refuses to push onto the source branch).
 */
export function targetBranchBlocker(
  app: RunnableApplication,
  branch: string
): RunBlocker | undefined {
  const detail = invalidTargetBranchReason(branch);
  if (detail) return { kind: "branchInvalid", detail };
  const source = app.repository?.branch;
  if (source && branch.trim() === source)
    return { kind: "branchMatchesSource", branch: source };
  return undefined;
}

/** Both checks; the branch check is skipped when no branch is chosen yet. */
export function runBlocker(
  app: RunnableApplication,
  branch?: string
): RunBlocker | undefined {
  return (
    applicationRunBlocker(app) ??
    (branch === undefined ? undefined : targetBranchBlocker(app, branch))
  );
}

/**
 * Split a selection into the applications a run can be created for and those
 * it cannot, so a caller can act on the eligible subset and report the rest
 * instead of blocking the whole batch on one bad application.
 */
export function partitionByRunEligibility<T extends RunnableApplication>(
  applications: T[],
  branchFor?: (app: T) => string
): { eligible: T[]; excluded: { application: T; blocker: RunBlocker }[] } {
  const eligible: T[] = [];
  const excluded: { application: T; blocker: RunBlocker }[] = [];
  for (const application of applications) {
    const blocker = runBlocker(application, branchFor?.(application));
    if (blocker) excluded.push({ application, blocker });
    else eligible.push(application);
  }
  return { eligible, excluded };
}
