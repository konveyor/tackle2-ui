import { useQueryClient } from "@tanstack/react-query";

import type { AgentWorkflowRun } from "@app/api/agentic/contract";
import { createWorkflowRun } from "@app/api/rest";
import { WORKFLOW_RUNS_QUERY_KEY } from "@app/queries/workflow-runs";

import { DecoratedApplication } from "../useDecoratedApplications";

export interface StartRunsInput {
  workflowRef: string;
  applications: DecoratedApplication[];
  targetBranch: string;
  params?: Record<string, string>;
}

export interface StartRunsResult {
  /** Echoed from the input so the caller can build the filtered landing. */
  workflowRef: string;
  success: { run: AgentWorkflowRun; application: DecoratedApplication }[];
  failure: { cause: Error; application: DecoratedApplication }[];
}

/**
 * Start one workflow run per application.
 *
 * There is no server-side fan-out for agentic runs — unlike analysis, which
 * submits a single Hub taskgroup that the server expands. Each create is its
 * own POST producing its own run, so the fan-out lives here and partial
 * failure is ours to report. Kept behind this one hook so a future
 * `applicationRefs[]` on the create endpoint can replace the loop without
 * touching the modal.
 *
 * See ibolton336/agentcontroller-client#4 for the server-side shape.
 */
export const useStartAgentWorkflowRuns = () => {
  const queryClient = useQueryClient();

  const startOne = async (
    input: StartRunsInput,
    application: DecoratedApplication
  ): Promise<
    StartRunsResult["success"][number] | StartRunsResult["failure"][number]
  > => {
    try {
      const run = await createWorkflowRun({
        workflowRef: input.workflowRef,
        // applicationRef carries the Hub application id as a string; this is
        // the same value as applicationLabelValue.
        applicationRef: String(application.id),
        targetBranch: input.targetBranch,
        params: input.params,
      });
      return { run, application };
    } catch (error) {
      return { cause: error as Error, application };
    }
  };

  const startRuns = async (input: StartRunsInput): Promise<StartRunsResult> => {
    const results = await Promise.allSettled(
      input.applications.map((application) => startOne(input, application))
    );

    const success: StartRunsResult["success"] = [];
    const failure: StartRunsResult["failure"] = [];
    for (const result of results) {
      if (result.status === "rejected") continue;
      if ("run" in result.value) success.push(result.value);
      else failure.push(result.value);
    }

    // One invalidation for the batch rather than per run.
    if (success.length > 0) {
      queryClient.invalidateQueries({ queryKey: [WORKFLOW_RUNS_QUERY_KEY] });
    }
    return { workflowRef: input.workflowRef, success, failure };
  };

  return { startRuns };
};
