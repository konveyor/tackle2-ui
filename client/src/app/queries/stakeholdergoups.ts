import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createStakeholderGroup,
  deleteStakeholderGroup,
  getStakeholderGroups,
  updateStakeholderGroup,
} from "@app/api/rest";
import { AxiosError } from "axios";

export const StakeholderGroupsQueryKey = "stakeholderGroups";

export const useFetchStakeholderGroups = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [StakeholderGroupsQueryKey],
    queryFn: getStakeholderGroups,
    onError: (error: AxiosError) => console.log("error, ", error),
  });
  return {
    stakeholderGroups: data || [],
    isFetching: isLoading,
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
      queryClient.invalidateQueries([StakeholderGroupsQueryKey]);
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
      queryClient.invalidateQueries([StakeholderGroupsQueryKey]);
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
      queryClient.invalidateQueries([StakeholderGroupsQueryKey]);
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries([StakeholderGroupsQueryKey]);
    },
  });
};
