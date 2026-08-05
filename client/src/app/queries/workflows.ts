import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import type {
  AgentWorkflow,
  AgentWorkflowSpec,
} from "@app/api/agentic/contract";
import {
  createWorkflow,
  deleteWorkflow,
  getWorkflows,
  updateWorkflow,
} from "@app/api/rest";

export const WORKFLOWS_QUERY_KEY = "workflows";

export const useFetchWorkflows = (
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { isLoading, error, data, refetch } = useQuery({
    queryKey: [WORKFLOWS_QUERY_KEY],
    queryFn: getWorkflows,
    onError: (error: AxiosError) => console.log(error),
    refetchInterval,
  });
  return { workflows: data || [], isLoading, fetchError: error, refetch };
};

export const useCreateWorkflowMutation = (
  onSuccess: (wf: AgentWorkflow) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, spec }: { name: string; spec: AgentWorkflowSpec }) =>
      createWorkflow(name, spec),
    onSuccess: (data) => {
      onSuccess(data);
      queryClient.invalidateQueries({ queryKey: [WORKFLOWS_QUERY_KEY] });
    },
    onError,
  });
};

export const useUpdateWorkflowMutation = (
  onSuccess: (wf: AgentWorkflow) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, spec }: { name: string; spec: AgentWorkflowSpec }) =>
      updateWorkflow(name, spec),
    onSuccess: (data) => {
      onSuccess(data);
      queryClient.invalidateQueries({ queryKey: [WORKFLOWS_QUERY_KEY] });
    },
    onError,
  });
};

export const useDeleteWorkflowMutation = (
  onSuccess: (name: string) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => deleteWorkflow(name),
    onSuccess: (_, name) => {
      onSuccess(name);
      queryClient.invalidateQueries({ queryKey: [WORKFLOWS_QUERY_KEY] });
    },
    onError,
  });
};
