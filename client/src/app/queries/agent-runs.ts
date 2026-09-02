import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import type { AgentRun } from "@app/api/agentic/contract";
import { createAgentRun, getAgentRun, getAgentRuns } from "@app/api/rest";

export const AGENT_RUNS_QUERY_KEY = "agentRuns";
export const AGENT_RUN_QUERY_KEY = "agentRun";

export const useFetchAgentRuns = (
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { isLoading, error, data, refetch } = useQuery({
    queryKey: [AGENT_RUNS_QUERY_KEY],
    queryFn: getAgentRuns,
    onError: (error: AxiosError) => console.log(error),
    refetchInterval,
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
    refetchInterval,
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
