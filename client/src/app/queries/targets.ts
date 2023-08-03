import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IReadFile, Metadata, Ruleset, Target } from "@app/api/models";
import {
  createFile,
  createTarget,
  deleteTarget,
  getRulesets,
  getTargets,
  updateTarget,
} from "@app/api/rest";
import { AxiosError } from "axios";
import { getLabels } from "@app/common/CustomRules/rules-utils";

export const TargetsQueryKey = "targets";

export const useFetchTargets = () => {
  async function getCompositeTargets() {
    const targets = await getTargets();
    const rulesets = await getRulesets();
    const compositeTargets = targets.map((target) => {
      console.log("target", target);
      console.log("targets", targets);
      console.log("rulesets", rulesets);
      return target;
    });

    // const rulesets= await getRulesetById();
    // const publisherIds = books.map(x => x.publisherId);
    // const publishers = await getPublishersForIds(publisherIds);
    // return { compositeTargets };
    return compositeTargets;
  }
  const { data, isLoading, error, refetch } = useQuery<any[]>(
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
