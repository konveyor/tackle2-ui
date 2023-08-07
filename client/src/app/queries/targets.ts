import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IReadFile, Target } from "@app/api/models";
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
  const { data, isLoading, error, refetch } = useQuery<Target[]>(
    [TargetsQueryKey],
    async () => await getTargets(),
    {
      onError: (err) => console.log(err),
    }
  );

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
  const { isLoading, mutate, error } = useMutation(updateTarget, {
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

  const { isLoading, mutate, error } = useMutation(deleteTarget, {
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
  const { isLoading, mutate, error } = useMutation(createTarget, {
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
  onSuccess?: (res: any, formData: FormData, file: IReadFile) => void,
  onError?: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isLoading, mutate, mutateAsync, error } = useMutation(createFile, {
    onSuccess: (res, { formData, file }) => {
      onSuccess && onSuccess(res, formData, file);
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
