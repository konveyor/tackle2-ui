import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import type { AgentWorkloadRun } from "@app/api/agentic/contract";
import {
  createWorkloadRun,
  deleteWorkloadRun,
  getWorkloadRun,
  getWorkloadRuns,
} from "@app/api/rest";

export const WORKLOAD_RUNS_QUERY_KEY = "workloadRuns";
export const WORKLOAD_RUN_QUERY_KEY = "workloadRun";

export const useFetchWorkloadRuns = (
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { isLoading, error, data, refetch } = useQuery({
    queryKey: [WORKLOAD_RUNS_QUERY_KEY],
    queryFn: getWorkloadRuns,
    onError: (error: AxiosError) => console.log(error),
    refetchInterval,
    // Runs mutate server-side while the user is elsewhere — keep polling
    // even when the tab is hidden so the page is current on return.
    refetchIntervalInBackground: true,
  });

  return {
    workloadRuns: data || [],
    isLoading,
    fetchError: error,
    refetch,
  };
};

export const useFetchWorkloadRun = (
  name: string,
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { isLoading, error, data } = useQuery({
    queryKey: [WORKLOAD_RUN_QUERY_KEY, name],
    queryFn: () => getWorkloadRun(name),
    onError: (error: AxiosError) => console.log(error),
    refetchInterval,
    refetchIntervalInBackground: true,
    enabled: !!name,
  });

  return {
    workloadRun: data,
    isLoading,
    fetchError: error,
  };
};

export const useCreateWorkloadRunMutation = (
  onSuccess: (run: AgentWorkloadRun) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorkloadRun,
    onSuccess: (data) => {
      onSuccess(data);
      queryClient.invalidateQueries({ queryKey: [WORKLOAD_RUNS_QUERY_KEY] });
    },
    onError,
  });
};

export const useDeleteWorkloadRunMutation = (
  onSuccess: (name: string) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => deleteWorkloadRun(name),
    onSuccess: (_, name) => {
      onSuccess(name);
      queryClient.invalidateQueries({ queryKey: [WORKLOAD_RUNS_QUERY_KEY] });
      // Drop (not refetch) the detail cache -- the run no longer exists.
      queryClient.removeQueries({ queryKey: [WORKLOAD_RUN_QUERY_KEY, name] });
    },
    onError,
  });
};
