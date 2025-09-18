import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import {
  createStakeholderGroup,
  deleteStakeholderGroup,
  getStakeholderGroups,
  updateStakeholderGroup,
} from "@app/api/rest";

export const StakeholderGroupsQueryKey = "stakeholderGroups";

export const useFetchStakeholderGroups = (
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { data, isLoading, isSuccess, error, refetch } = useQuery({
    queryKey: [StakeholderGroupsQueryKey],
    queryFn: getStakeholderGroups,
    onError: (error: AxiosError) => console.log("error, ", error),
    refetchInterval,
  });
  return {
    stakeholderGroups: data || [],
    isFetching: isLoading,
    isSuccess,
    fetchError: error,
    refetch,
  };
};

export const useCreateStakeholderGroupMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStakeholderGroup,
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries({ queryKey: [StakeholderGroupsQueryKey] });
    },
    onError,
  });
};

export const useUpdateStakeholderGroupMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateStakeholderGroup,
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries({ queryKey: [StakeholderGroupsQueryKey] });
    },
    onError: onError,
  });
};

export const useDeleteStakeholderGroupMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStakeholderGroup,
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries({ queryKey: [StakeholderGroupsQueryKey] });
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries({ queryKey: [StakeholderGroupsQueryKey] });
    },
  });
};
