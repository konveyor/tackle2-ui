import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import type { AgentRun } from "@app/api/agentic/contract";
import {
  createAgentRun,
  deleteAgentRun,
  getAgentRun,
  getAgentRuns,
} from "@app/api/rest";
import {
  AGENTIC_QUERY_RETRY,
  pollUnlessErrored,
} from "@app/queries/agentic-polling";

export const AGENT_RUNS_QUERY_KEY = "agentRuns";
export const AGENT_RUN_QUERY_KEY = "agentRun";

export const useFetchAgentRuns = (
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { isLoading, error, data, refetch } = useQuery({
    queryKey: [AGENT_RUNS_QUERY_KEY],
    queryFn: getAgentRuns,
    onError: (error: AxiosError) => console.log(error),
    retry: AGENTIC_QUERY_RETRY,
    refetchInterval: (_data, query) =>
      pollUnlessErrored(query, refetchInterval),
    // Runs mutate server-side while the user is elsewhere — keep polling
    // even when the tab is hidden so the page is current on return.
    refetchIntervalInBackground: true,
  });

  return {
    agentRuns: data || [],
    isLoading,
    fetchError: error,
    refetch,
  };
};

export const useFetchAgentRun = (
  name: string,
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { isLoading, error, data } = useQuery({
    queryKey: [AGENT_RUN_QUERY_KEY, name],
    queryFn: () => getAgentRun(name),
    onError: (error: AxiosError) => console.log(error),
    retry: AGENTIC_QUERY_RETRY,
    refetchInterval: (_data, query) =>
      pollUnlessErrored(query, refetchInterval),
    refetchIntervalInBackground: true,
    enabled: !!name,
  });

  return {
    agentRun: data,
    isLoading,
    fetchError: error,
  };
};

export const useCreateAgentRunMutation = (
  onSuccess: (run: AgentRun) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAgentRun,
    onSuccess: (data) => {
      onSuccess(data);
      queryClient.invalidateQueries({ queryKey: [AGENT_RUNS_QUERY_KEY] });
    },
    onError,
  });
};

export const useDeleteAgentRunsMutation = (
  onSuccess: (names: string[]) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    // Let every delete settle before reporting the batch. Promise.all rejects
    // as soon as one request fails, which ran onError and the refetch while the
    // rest were still in flight -- the page could report a failure, and refresh
    // around it, while the server was still deleting the other runs.
    mutationFn: async (names: string[]) => {
      const results = await Promise.allSettled(
        names.map((name) => deleteAgentRun(name))
      );
      const failure = results.find(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected"
      );
      if (failure) {
        throw failure.reason as AxiosError;
      }
    },
    onSuccess: (_, names) => onSuccess(names),
    onError,
    // A partial failure still leaves the list stale, so refresh either way.
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: [AGENT_RUNS_QUERY_KEY] }),
  });
};
