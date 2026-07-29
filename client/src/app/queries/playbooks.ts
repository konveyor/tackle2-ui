import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import type {
  AgentPlaybook,
  AgentPlaybookSpec,
} from "@app/api/agentic/contract";
import {
  createPlaybook,
  deletePlaybook,
  getPlaybooks,
  updatePlaybook,
} from "@app/api/rest";

export const PLAYBOOKS_QUERY_KEY = "playbooks";

export const useFetchPlaybooks = (
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { isLoading, error, data, refetch } = useQuery({
    queryKey: [PLAYBOOKS_QUERY_KEY],
    queryFn: getPlaybooks,
    onError: (error: AxiosError) => console.log(error),
    refetchInterval,
  });
  return { playbooks: data || [], isLoading, fetchError: error, refetch };
};

export const useCreatePlaybookMutation = (
  onSuccess: (pb: AgentPlaybook) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, spec }: { name: string; spec: AgentPlaybookSpec }) =>
      createPlaybook(name, spec),
    onSuccess: (data) => {
      onSuccess(data);
      queryClient.invalidateQueries({ queryKey: [PLAYBOOKS_QUERY_KEY] });
    },
    onError,
  });
};

export const useUpdatePlaybookMutation = (
  onSuccess: (pb: AgentPlaybook) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, spec }: { name: string; spec: AgentPlaybookSpec }) =>
      updatePlaybook(name, spec),
    onSuccess: (data) => {
      onSuccess(data);
      queryClient.invalidateQueries({ queryKey: [PLAYBOOKS_QUERY_KEY] });
    },
    onError,
  });
};

export const useDeletePlaybookMutation = (
  onSuccess: (name: string) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => deletePlaybook(name),
    onSuccess: (_, name) => {
      onSuccess(name);
      queryClient.invalidateQueries({ queryKey: [PLAYBOOKS_QUERY_KEY] });
    },
    onError,
  });
};
