import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import { New, StakeholderGroup } from "@app/api/models";
import {
  createStakeholderGroup,
  deleteStakeholderGroup,
  getStakeholderGroups,
  updateStakeholderGroup,
} from "@app/api/rest";

const StakeholderGroupsQueryKey = "stakeholderGroups";

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
  onSuccess: (group: StakeholderGroup) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (obj: New<StakeholderGroup>) => createStakeholderGroup(obj),
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries({ queryKey: [StakeholderGroupsQueryKey] });
    },
    onError,
  });
};

export const useUpdateStakeholderGroupMutation = (
  onSuccess: (group: StakeholderGroup) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateStakeholderGroup,
    onSuccess: (_, group) => {
      onSuccess(group);
      queryClient.invalidateQueries({ queryKey: [StakeholderGroupsQueryKey] });
    },
    onError: onError,
  });
};

export const useDeleteStakeholderGroupMutation = (
  onSuccess: () => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStakeholderGroup,
    onSuccess: () => {
      onSuccess();
      queryClient.invalidateQueries({ queryKey: [StakeholderGroupsQueryKey] });
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries({ queryKey: [StakeholderGroupsQueryKey] });
    },
  });
};
