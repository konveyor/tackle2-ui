import { useMutation, useQuery, useQueryClient } from "react-query";
import { Stakeholder } from "@app/api/models";
import { deleteStakeholder, getStakeholders } from "@app/api/rest";
import { AxiosError } from "axios";

export interface IStakeholderFetchState {
  stakeholders: Stakeholder[];
  isFetching: boolean;
  fetchError: any;
  refetch: any;
}
export interface IStakeholderMutateState {
  mutate: any;
  isLoading: boolean;
  error: any;
}

export const StakeholdersQueryKey = "stakeholders";

export const useFetchStakeholders = (): IStakeholderFetchState => {
  const { data, isLoading, error, refetch } = useQuery(
    StakeholdersQueryKey,
    async () => (await getStakeholders()).data,
    {
      onError: (error) => console.log("error, ", error),
    }
  );
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
): IStakeholderMutateState => {
  const queryClient = useQueryClient();

  const { isLoading, mutate, error } = useMutation(deleteStakeholder, {
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries(StakeholdersQueryKey);
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries(StakeholdersQueryKey);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};
