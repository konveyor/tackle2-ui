import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import type {
  AgentResource,
  AgentResourceSpec,
} from "@app/api/agentic/contract";
import {
  createAgent,
  deleteAgent,
  getAgents,
  updateAgent,
} from "@app/api/rest";

export const AGENTS_QUERY_KEY = "agents";

export const useFetchAgents = (
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { isLoading, error, data, refetch } = useQuery({
    queryKey: [AGENTS_QUERY_KEY],
    queryFn: getAgents,
    onError: (error: AxiosError) => console.log(error),
    refetchInterval,
  });

  return {
    agents: data || [],
    isLoading,
    fetchError: error,
    refetch,
  };
};

export const useCreateAgentMutation = (
  onSuccess: (a: AgentResource) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, spec }: { name: string; spec: AgentResourceSpec }) =>
      createAgent(name, spec),
    onSuccess: (data) => {
      onSuccess(data);
      queryClient.invalidateQueries({ queryKey: [AGENTS_QUERY_KEY] });
    },
    onError,
  });
};

export const useUpdateAgentMutation = (
  onSuccess: () => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, spec }: { name: string; spec: AgentResourceSpec }) =>
      updateAgent(name, spec),
    onSuccess: () => {
      onSuccess();
      queryClient.invalidateQueries({ queryKey: [AGENTS_QUERY_KEY] });
    },
    onError,
  });
};

export const useDeleteAgentMutation = (
  onSuccess: (name: string) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => deleteAgent(name),
    onSuccess: (_, name) => {
      onSuccess(name);
      queryClient.invalidateQueries({ queryKey: [AGENTS_QUERY_KEY] });
    },
    onError,
  });
};
