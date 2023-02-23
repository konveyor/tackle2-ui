import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IReadFile, RuleBundle } from "@app/api/models";
import {
  createFile,
  createRuleBundle,
  deleteRuleBundle,
  getRuleBundles,
  getSettingById,
  updateRuleBundle,
} from "@app/api/rest";
import { AxiosError } from "axios";

export const RuleBundlesQueryKey = "rulebundles";

export const useFetchRuleBundles = () => {
  const { data, isLoading, error, refetch } = useQuery<RuleBundle[]>(
    [RuleBundlesQueryKey],
    async () => await getRuleBundles(),
    {
      onError: (err) => console.log(err),
    }
  );
  return {
    ruleBundles: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useUpdateRuleBundleMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isLoading, mutate, error } = useMutation(updateRuleBundle, {
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([RuleBundlesQueryKey]);
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

export const useDeleteRuleBundleMutation = (
  onSuccess: (res: any, id: number) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  const { isLoading, mutate, error } = useMutation(deleteRuleBundle, {
    onSuccess: (res, id) => {
      onSuccess(res, id);
      queryClient.invalidateQueries([RuleBundlesQueryKey]);
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries([RuleBundlesQueryKey]);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};

export const useCreateRuleBundleMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isLoading, mutate, error } = useMutation(createRuleBundle, {
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([RuleBundlesQueryKey]);
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
  onSuccess: (res: any, formData: FormData, file: IReadFile) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isLoading, mutate, error } = useMutation(createFile, {
    onSuccess: (res, { formData, file }) => {
      onSuccess(res, formData, file);
      queryClient.invalidateQueries([]);
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
