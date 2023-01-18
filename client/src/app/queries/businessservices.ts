import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteBusinessService,
  getBusinessServiceById,
  getBusinessServices,
} from "@app/api/rest";
import { BusinessService } from "@app/api/models";
import { AxiosError } from "axios";

export const BusinessServicesQueryKey = "businessservices";
export const BusinessServiceQueryKey = "businessservice";

export const useFetchBusinessServices = () => {
  const { data, isLoading, error, refetch } = useQuery<BusinessService[]>(
    [BusinessServicesQueryKey],
    async () => (await getBusinessServices()).data,
    {
      onError: (error) => console.log("error, ", error),
    }
  );
  return {
    businessServices: data || [],
    isFetching: isLoading,
    fetchError: error as AxiosError,
    refetch,
  };
};
export const useFetchBusinessServiceByID = (id: number | string) => {
  const { data, isLoading, error } = useQuery<BusinessService>(
    [BusinessServicesQueryKey, id],
    async () => (await getBusinessServiceById(id)).data,
    { onError: (error) => console.log(error) }
  );

  return {
    businessService: data,
    isFetching: isLoading,
    fetchError: error as AxiosError,
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
      queryClient.invalidateQueries([BusinessServicesQueryKey]);
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries([BusinessServicesQueryKey]);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};
