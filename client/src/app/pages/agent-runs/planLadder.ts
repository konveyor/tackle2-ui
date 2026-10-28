import type { PlanRungMeta } from "@app/api/agentic/acp";
import { PLAN_META_KEY } from "@app/api/agentic/acp";

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
 * The ladder's turn count, for the header to report. Found by the field
 * rather than by position, so an older harness — which publishes the
 * sentence and no fields — simply contributes nothing.
 */
export function planTurns(
  entries: PlanEntry[]
): Pick<PlanRungMeta, "turnsUsed" | "maxTurns"> | undefined {
  return entries.map((e) => e.meta).find((m) => m.turnsUsed !== undefined);
}
