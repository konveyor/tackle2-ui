import type { PlanRungMeta } from "@app/api/agentic/acp";
import { PLAN_META_KEY } from "@app/api/agentic/acp";
import { formatDuration } from "@app/utils/agentic";

/** One rung of the harness's task ladder, as the chat panel holds it. */
export interface PlanEntry {
  /** The rung's sentence, as the harness wrote it. Always present. */
  content: string;
  /** ACP plan status: "pending" | "in_progress" | "completed". */
  status: string;
  /**
   * What the rung says, as data rather than as the sentence in `content`
   * (`_meta["konveyor.io/plan"]`). Empty from a harness that predates
   * agentic-controller#268, and from any harness for a value this run
   * cannot know — so every field is read as optional.
   */
  meta: PlanRungMeta;
  /**
   * When this rung entered its current status, as this viewer saw it
   * happen. Absent until it does: see `timeRungs`.
   */
  since?: number;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

const text = (v: unknown): string | undefined =>
  typeof v === "string" && v !== "" ? v : undefined;

const count = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

/**
 * A plan entry's facts as the harness publishes them, or {} when it does
 * not. Fields are read one at a time rather than cast wholesale: this
 * crosses a version boundary — the harness in the sandbox is whatever image
 * the run was launched with, not whatever this console was built against.
 */
export function planRungMeta(entry: unknown): PlanRungMeta {
  const raw =
    isRecord(entry) && isRecord(entry._meta)
      ? entry._meta[PLAN_META_KEY]
      : undefined;
  if (!isRecord(raw)) return {};
  return {
    rung: text(raw.rung),
    repo: text(raw.repo),
    branch: text(raw.branch),
    insights: count(raw.insights),
    task: text(raw.task),
    goal: text(raw.goal),
    stage: count(raw.stage),
    stageCount: count(raw.stageCount),
    model: text(raw.model),
    turnsUsed: count(raw.turnsUsed),
    maxTurns: count(raw.maxTurns),
    pushes: count(raw.pushes),
    commits: count(raw.commits),
  };
}

/**
 * The rungs of one `plan` session update. A rung with no sentence is
 * dropped: `content` is the only part of the ladder every harness sends,
 * and a row with nothing to read in it is not worth a line.
 */
export function planEntries(raw: unknown): PlanEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isRecord)
    .map((e) => ({
      content: text(e.content) ?? "",
      status: text(e.status) ?? "pending",
      meta: planRungMeta(e),
    }))
    .filter((e) => e.content !== "");
}

/**
 * Carry each rung's "in this status since" stamp across a ladder rewrite,
 * restamping only the rungs whose status actually changed.
 *
 * A rung is stamped only on a transition this viewer watched happen. The
 * ladder carries no timestamps of its own, so a rung already in progress
 * when the panel attached has no honest start time, and timing it from the
 * attach would tell someone who joined a two-hour run that the step began
 * seconds ago. Unknown stays unknown.
 *
 * Rungs are matched by position: the harness publishes the same ladder, in
 * the same order, for the whole run.
 */
export function timeRungs(
  prev: PlanEntry[],
  next: PlanEntry[],
  now: number = Date.now()
): PlanEntry[] {
  return next.map((e, i) => {
    const was = prev[i];
    if (!was) return e;
    return { ...e, since: was.status === e.status ? was.since : now };
  });
}

/**
 * How long the rung in progress has been in progress, or null. Only a rung
 * still running is timed: for a finished one the stamp says when it
 * stopped, which is not its duration, and reading it as one would show a
 * completed step counting upwards forever.
 */
export function rungElapsed(
  entry: PlanEntry,
  now: number = Date.now()
): string | null {
  if (entry.status !== "in_progress" || entry.since === undefined) return null;
  return formatDuration(Math.max(0, Math.round((now - entry.since) / 1000)));
}

/**
 * The ladder's turn count, for the header to report. Found by the field
 * rather than by position, so an older harness — which publishes the
 * sentence and no fields — simply contributes nothing.
 */
export function planTurns(
  entries: PlanEntry[]
): Pick<PlanRungMeta, "turnsUsed" | "maxTurns"> | undefined {
  return entries.map((e) => e.meta).find((m) => m.turnsUsed !== undefined);
}
