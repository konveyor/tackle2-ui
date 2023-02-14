import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BundleOrderSetting, RuleBundle } from "@app/api/models";
import {
  createImageFile,
  createRuleBundle,
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

export const useCreateImageFileMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isLoading, mutate, error } = useMutation(createImageFile, {
    onSuccess: (res) => {
      onSuccess(res);
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

export const BundleOrderSettingKey = "ui.bundle.order";
export const useFetchBundleOrder = (ruleBundles: RuleBundle[]) => {
  const { data, isLoading, error, refetch } = useQuery<BundleOrderSetting>(
    [BundleOrderSettingKey],
    async () => {
      return {
        key: BundleOrderSettingKey,
        value: (await getSettingById(BundleOrderSettingKey)).data,
      };
    },
    {
      onError: (err) => console.log(err),
    }
  );
  return {
    bundleOrderSetting: data || {
      key: BundleOrderSettingKey,
      value: ruleBundles.map((ruleBundle) => ruleBundle?.id),
    },
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};
