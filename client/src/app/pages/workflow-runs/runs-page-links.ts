import { TablePersistenceKeyPrefix } from "@app/Constants";
import { DevPaths } from "@app/Paths";
import { serializeFilterUrlParams } from "@app/hooks/table-controls";

/**
 * Deep link to the workflow-runs page with filter chips pre-applied — the
 * canonical landing after a launch (the runs page filtered to what was just
 * launched) and the target for per-application run views. Values must match
 * the page's row values exactly: application display names and workflowRef
 * names.
 */
export function workflowRunsPath(filters?: {
  application?: string[];
  workflow?: string[];
}): string {
  const serialized = serializeFilterUrlParams(filters ?? {}).filters;
  if (!serialized) return DevPaths.workflowRuns;
  const query = new URLSearchParams({
    [`${TablePersistenceKeyPrefix.agentWorkflowRuns}:filters`]: serialized,
  });
  return `${DevPaths.workflowRuns}?${query}`;
}
