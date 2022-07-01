import { useMutation, useQuery, useQueryClient } from "react-query";
import { StakeholderGroup } from "@app/api/models";
import { deleteStakeholderGroup, getStakeholderGroups } from "@app/api/rest";
import { AxiosError } from "axios";

export interface IStakeholderGroupFetchState {
  stakeholderGroups: StakeholderGroup[];
  isFetching: boolean;
  fetchError: any;
  refetch: any;
}
export interface IStakeholderGroupMutateState {
  mutate: any;
  isLoading: boolean;
  error: any;
}

export const StakeholderGroupsQueryKey = "stakeholderGroups";

export const useFetchStakeholderGroups = (): IStakeholderGroupFetchState => {
  const { data, isLoading, error, refetch } = useQuery(
    StakeholderGroupsQueryKey,
    async () => (await getStakeholderGroups()).data,
    {
      onError: (error) => console.log("error, ", error),
    }
  );
  return {
    stakeholderGroups: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useDeleteStakeholderGroupMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
): IStakeholderGroupMutateState => {
  const queryClient = useQueryClient();

  const { isLoading, mutate, error } = useMutation(deleteStakeholderGroup, {
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries(StakeholderGroupsQueryKey);
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries(StakeholderGroupsQueryKey);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};
