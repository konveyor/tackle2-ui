import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createStakeholder,
  deleteStakeholder,
  getStakeholders,
  updateStakeholder,
} from "@app/api/rest";
import { AxiosError } from "axios";

export const StakeholdersQueryKey = "stakeholders";

export const useFetchStakeholders = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [StakeholdersQueryKey],
    queryFn: getStakeholders,
    onError: (error: AxiosError) => console.log("error, ", error),
  });
  return {
    stakeholders: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useCreateStakeholderMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStakeholder,
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([StakeholdersQueryKey]);
    },
    onError,
  });
};

export const useUpdateStakeholderMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateStakeholder,
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([StakeholdersQueryKey]);
    },
    onError: onError,
  });
};

export const useDeleteStakeholderMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStakeholder,
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([StakeholdersQueryKey]);
    },
    onError: onError,
  });
};
