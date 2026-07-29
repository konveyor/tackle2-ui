import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import type { AgentPlaybookRun } from "@app/api/agentic/contract";
import {
  createPlaybookRun,
  deletePlaybookRun,
  getPlaybookRun,
  getPlaybookRuns,
} from "@app/api/rest";

export const PLAYBOOK_RUNS_QUERY_KEY = "playbookRuns";
export const PLAYBOOK_RUN_QUERY_KEY = "playbookRun";

export const useFetchPlaybookRuns = (
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { isLoading, error, data, refetch } = useQuery({
    queryKey: [PLAYBOOK_RUNS_QUERY_KEY],
    queryFn: getPlaybookRuns,
    onError: (error: AxiosError) => console.log(error),
    refetchInterval,
    // Runs mutate server-side while the user is elsewhere — keep polling
    // even when the tab is hidden so the page is current on return.
    refetchIntervalInBackground: true,
  });

  return {
    playbookRuns: data || [],
    isLoading,
    fetchError: error,
    refetch,
  };
};

export const useFetchPlaybookRun = (
  name: string,
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { isLoading, error, data } = useQuery({
    queryKey: [PLAYBOOK_RUN_QUERY_KEY, name],
    queryFn: () => getPlaybookRun(name),
    onError: (error: AxiosError) => console.log(error),
    refetchInterval,
    refetchIntervalInBackground: true,
    enabled: !!name,
  });

  return {
    playbookRun: data,
    isLoading,
    fetchError: error,
  };
};

export const useCreatePlaybookRunMutation = (
  onSuccess: (run: AgentPlaybookRun) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPlaybookRun,
    onSuccess: (data) => {
      onSuccess(data);
      queryClient.invalidateQueries({ queryKey: [PLAYBOOK_RUNS_QUERY_KEY] });
    },
    onError,
  });
};

export const useDeletePlaybookRunMutation = (
  onSuccess: (name: string) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => deletePlaybookRun(name),
    onSuccess: (_, name) => {
      onSuccess(name);
      queryClient.invalidateQueries({ queryKey: [PLAYBOOK_RUNS_QUERY_KEY] });
      // Drop (not refetch) the detail cache -- the run no longer exists.
      queryClient.removeQueries({ queryKey: [PLAYBOOK_RUN_QUERY_KEY, name] });
    },
    onError,
  });
};
