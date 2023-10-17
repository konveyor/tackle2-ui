import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HubFile, IReadFile, Target } from "@app/api/models";
import {
  createFile,
  createTarget,
  deleteTarget,
  getTargets,
  updateTarget,
} from "@app/api/rest";
import { AxiosError } from "axios";

export const TargetsQueryKey = "targets";

export const useFetchTargets = () => {
  const { data, isLoading, error, refetch } = useQuery<Target[]>({
    queryKey: [TargetsQueryKey],
    queryFn: async () => await getTargets(),
    onError: (err) => console.log(err),
  });

  return {
    targets: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useUpdateTargetMutation = (
  onSuccess: (res: Target) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isLoading, mutate, error } = useMutation({
    mutationFn: updateTarget,
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([TargetsQueryKey]);
    },
    onError: (err: AxiosError) => {
      onError(err);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};

export const useDeleteTargetMutation = (
  onSuccess: (res: Target, id: number) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  const { isLoading, mutate, error } = useMutation({
    mutationFn: deleteTarget,
    onSuccess: (res, id) => {
      onSuccess(res, id);
      queryClient.invalidateQueries([TargetsQueryKey]);
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries([TargetsQueryKey]);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};

export const useCreateTargetMutation = (
  onSuccess: (res: Target) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isLoading, mutate, error } = useMutation({
    mutationFn: createTarget,
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([TargetsQueryKey]);
    },
    onError: (err: AxiosError) => {
      onError(err);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};

export const useCreateFileMutation = (
  onSuccess?: (data: HubFile, formData: FormData, file: IReadFile) => void,
  onError?: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isLoading, mutate, mutateAsync, error } = useMutation({
    mutationFn: createFile,
    onSuccess: (data, { formData, file }) => {
      onSuccess && onSuccess(data, formData, file);
      queryClient.invalidateQueries([]);
    },
    onError: (err: AxiosError) => {
      onError && onError(err);
    },
  });
  return {
    mutate,
    mutateAsync,
    isLoading,
    error,
  };
};
