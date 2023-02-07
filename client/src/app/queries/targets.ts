import { useMutation, useQuery, useQueryClient } from "react-query";
import { CustomTarget } from "@app/api/models";
import { AxiosError } from "axios";
import { createCustomTarget, updateCustomTarget } from "@app/api/rest";

export const CustomTargetsQueryKey = "stakeholderGroups";

export const useFetchCustomTargets = () => {
  const { data, isLoading, error, refetch } = useQuery<CustomTarget[]>(
    CustomTargetsQueryKey,
    // async () => (await getCustomTargets()).data,
    async () => [],
    {
      onError: (error) => console.log("error, ", error as AxiosError),
    }
  );
  return {
    // customTargets: data || [],
    customTargets: [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useUpdateCustomTargetMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isLoading, mutate, error } = useMutation(updateCustomTarget, {
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries(CustomTargetsQueryKey);
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

export const useCreateCustomTargetMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isLoading, mutate, error } = useMutation(createCustomTarget, {
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries(ApplicationsQueryKey);
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
