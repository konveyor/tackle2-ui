import type { AgentWorkloadRun } from "@app/api/agentic/contract";

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

/** Workload-run status has no duration field — derive it from timestamps. */
export function workloadRunDuration(run: AgentWorkloadRun): number | undefined {
  const start = run.status?.startTime;
  if (!start) return undefined;
  const end = run.status?.completionTime;
  const ms = (end ? Date.parse(end) : Date.now()) - Date.parse(start);
  return ms >= 0 ? Math.round(ms / 1000) : undefined;
}

export function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max - 1) + "…";
}
