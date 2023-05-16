import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteStakeholder, getStakeholders } from "@app/api/rest";
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
