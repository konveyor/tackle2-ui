import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import type { AgentWorkflowRun } from "@app/api/agentic/contract";
import {
  createWorkflowRun,
  getWorkflowRun,
  getWorkflowRuns,
} from "@app/api/rest";
import {
  AGENTIC_QUERY_RETRY,
  pollUnlessErrored,
} from "@app/queries/agentic-polling";

export const WORKFLOW_RUNS_QUERY_KEY = "workflowRuns";
export const WORKFLOW_RUN_QUERY_KEY = "workflowRun";

export const useFetchWorkflowRuns = (
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { isLoading, error, data, refetch } = useQuery({
    queryKey: [WORKFLOW_RUNS_QUERY_KEY],
    queryFn: getWorkflowRuns,
    onError: (error: AxiosError) => console.log(error),
    retry: AGENTIC_QUERY_RETRY,
    refetchInterval: (_data, query) =>
      pollUnlessErrored(query, refetchInterval),
    // Runs mutate server-side while the user is elsewhere — keep polling
    // even when the tab is hidden so the page is current on return.
    refetchIntervalInBackground: true,
  });

  return {
    workflowRuns: data || [],
    isLoading,
    fetchError: error,
    refetch,
  };
};

export const useFetchWorkflowRun = (
  name: string,
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { isLoading, error, data } = useQuery({
    queryKey: [WORKFLOW_RUN_QUERY_KEY, name],
    queryFn: () => getWorkflowRun(name),
    onError: (error: AxiosError) => console.log(error),
    retry: AGENTIC_QUERY_RETRY,
    refetchInterval: (_data, query) =>
      pollUnlessErrored(query, refetchInterval),
    refetchIntervalInBackground: true,
    enabled: !!name,
  });

  return {
    workflowRun: data,
    isLoading,
    fetchError: error,
  };
};

export const useCreateWorkflowRunMutation = (
  onSuccess: (run: AgentWorkflowRun) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorkflowRun,
    onSuccess: (data) => {
      onSuccess(data);
      queryClient.invalidateQueries({ queryKey: [WORKFLOW_RUNS_QUERY_KEY] });
    },
    onError,
  });
};
