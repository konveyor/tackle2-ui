import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import type {
  AgentWorkload,
  AgentWorkloadSpec,
} from "@app/api/agentic/contract";
import {
  createWorkload,
  deleteWorkload,
  getWorkloads,
  updateWorkload,
} from "@app/api/rest";

export const WORKLOADS_QUERY_KEY = "workloads";

export const useFetchWorkloads = (
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { isLoading, error, data, refetch } = useQuery({
    queryKey: [WORKLOADS_QUERY_KEY],
    queryFn: getWorkloads,
    onError: (error: AxiosError) => console.log(error),
    refetchInterval,
  });
  return { workloads: data || [], isLoading, fetchError: error, refetch };
};

export const useCreateWorkloadMutation = (
  onSuccess: (pb: AgentWorkload) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, spec }: { name: string; spec: AgentWorkloadSpec }) =>
      createWorkload(name, spec),
    onSuccess: (data) => {
      onSuccess(data);
      queryClient.invalidateQueries({ queryKey: [WORKLOADS_QUERY_KEY] });
    },
    onError,
  });
};

export const useUpdateWorkloadMutation = (
  onSuccess: (pb: AgentWorkload) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, spec }: { name: string; spec: AgentWorkloadSpec }) =>
      updateWorkload(name, spec),
    onSuccess: (data) => {
      onSuccess(data);
      queryClient.invalidateQueries({ queryKey: [WORKLOADS_QUERY_KEY] });
    },
    onError,
  });
};

export const useDeleteWorkloadMutation = (
  onSuccess: (name: string) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => deleteWorkload(name),
    onSuccess: (_, name) => {
      onSuccess(name);
      queryClient.invalidateQueries({ queryKey: [WORKLOADS_QUERY_KEY] });
    },
    onError,
  });
};
