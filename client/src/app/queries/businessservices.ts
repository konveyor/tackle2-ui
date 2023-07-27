import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import {
  createBusinessService,
  deleteBusinessService,
  getBusinessServiceById,
  getBusinessServices,
  updateBusinessService,
} from "@app/api/rest";

export const BusinessServicesQueryKey = "businessservices";
export const BusinessServiceQueryKey = "businessservice";

export const useFetchBusinessServices = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [BusinessServicesQueryKey],
    queryFn: getBusinessServices,
    onError: (error: AxiosError) => console.log("error, ", error),
  });
  return {
    businessServices: data || [],
    isFetching: isLoading,
    fetchError: error as AxiosError,
    refetch,
  };
};

export const useFetchBusinessServiceByID = (id: number | string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: [BusinessServicesQueryKey, id],
    queryFn: () => getBusinessServiceById(id),
    onError: (error: AxiosError) => console.log("error, ", error),
  });
  return {
    businessService: data,
    isFetching: isLoading,
    fetchError: error as AxiosError,
  };
};

export const useCreateBusinessServiceMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBusinessService,
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([BusinessServicesQueryKey]);
    },
    onError,
  });
};

export const useUpdateBusinessServiceMutation = (
  onSuccess: () => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBusinessService,
    onSuccess: () => {
      onSuccess();
      queryClient.invalidateQueries([BusinessServicesQueryKey]);
    },
    onError: onError,
  });
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
