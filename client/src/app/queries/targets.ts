import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError, AxiosResponse } from "axios";

import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import { HubFile, Target } from "@app/api/models";
import {
  createFile,
  createTarget,
  deleteTarget,
  getTargets,
  updateTarget,
} from "@app/api/rest";

export const TargetsQueryKey = "targets";

export const useFetchTargets = (
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { data, isLoading, isSuccess, error, refetch } = useQuery<Target[]>({
    queryKey: [TargetsQueryKey],
    queryFn: async () => await getTargets(),
    onError: (err) => console.log(err),
    refetchInterval,
  });

  return {
    targets: data || [],
    isFetching: isLoading,
    isSuccess,
    fetchError: error,
    refetch,
  };
};

export const useUpdateTargetMutation = (
  onSuccess: (res: AxiosResponse<Target>) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isPending, mutate, error } = useMutation({
    mutationFn: updateTarget,
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries({ queryKey: [TargetsQueryKey] });
    },
    onError: (err: AxiosError) => {
      onError(err);
    },
  });
  return {
    mutate,
    isPending,
    error,
  };
};

export const useDeleteTargetMutation = (
  onSuccess: (res: Target, id: number) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  const { isPending, mutate, error } = useMutation({
    mutationFn: deleteTarget,
    onSuccess: (res, id) => {
      onSuccess(res, id);
      queryClient.invalidateQueries({ queryKey: [TargetsQueryKey] });
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries({ queryKey: [TargetsQueryKey] });
    },
  });
  return {
    mutate,
    isPending,
    error,
  };
};

export const useCreateTargetMutation = (
  onSuccess: (res: AxiosResponse<Target>) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isPending, mutate, error } = useMutation({
    mutationFn: createTarget,
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries({ queryKey: [TargetsQueryKey] });
    },
    onError: (err: AxiosError) => {
      onError(err);
    },
  });
  return {
    mutate,
    isPending,
    error,
  };
};

export const useCreateFileMutation = (
  onSuccess?: (data: HubFile, file: File) => void,
  onError?: (err: AxiosError, file: File) => void
) => {
  const queryClient = useQueryClient();
  const { isPending, mutate, mutateAsync, error } = useMutation({
    mutationFn: createFile,
    onSuccess: (data, { file }) => {
      onSuccess?.(data, file);
      queryClient.invalidateQueries({ queryKey: [TargetsQueryKey] });
    },
    onError: (err: AxiosError, { file }) => {
      onError?.(err, file);
    },
  });
  return {
    mutate,
    mutateAsync,
    isPending,
    error,
  };
};

// TODO: Add `useRemoveFileMutation` with id, name, path as the required rest fields
