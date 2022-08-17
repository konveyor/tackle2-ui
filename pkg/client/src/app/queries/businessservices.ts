import { useMutation, useQuery, useQueryClient } from "react-query";

import { deleteBusinessService, getBusinessServices } from "@app/api/rest";
import { BusinessService } from "@app/api/models";
import { AxiosError } from "axios";

export interface IBusinessServiceFetchState {
  businessServices: BusinessService[];
  isFetching: boolean;
  fetchError: any;
  refetch: any;
}

export const BusinessServicesQueryKey = "businessservices";

export const useFetchBusinessServices = (): IBusinessServiceFetchState => {
  const { data, isLoading, error, refetch } = useQuery(
    BusinessServicesQueryKey,
    async () => (await getBusinessServices()).data,
    {
      onError: (error) => console.log("error, ", error),
    }
  );
  return {
    businessServices: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useDeleteBusinessServiceMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  const { isLoading, mutate, error } = useMutation(deleteBusinessService, {
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries(BusinessServicesQueryKey);
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries(BusinessServicesQueryKey);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};
