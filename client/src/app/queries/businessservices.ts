import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import { BusinessService, New } from "@app/api/models";
import {
  createBusinessService,
  deleteBusinessService,
  getBusinessServiceById,
  getBusinessServices,
  updateBusinessService,
} from "@app/api/rest";

export const BusinessServicesQueryKey = "businessservices";
export const BusinessServiceQueryKey = "businessservice";

export const useFetchBusinessServices = (
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { data, isLoading, isSuccess, error, refetch } = useQuery({
    queryKey: [BusinessServicesQueryKey],
    queryFn: getBusinessServices,
    onError: (error: AxiosError) => console.log("error, ", error),
    refetchInterval,
  });
  return {
    businessServices: data || [],
    isFetching: isLoading,
    isLoading,
    isSuccess,
    fetchError: error as AxiosError,
    refetch,
  };
};

export const useFetchBusinessServiceById = (
  id: number | string,
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { data, isLoading, error } = useQuery({
    queryKey: [BusinessServicesQueryKey, id],
    queryFn: () => getBusinessServiceById(id),
    onError: (error: AxiosError) => console.log("error, ", error),
    refetchInterval,
  });
  return {
    businessService: data,
    isFetching: isLoading,
    fetchError: error as AxiosError,
  };
};

export const useCreateBusinessServiceMutation = (
  onSuccess: (res: BusinessService) => void,
  onError: (err: AxiosError, payload: New<BusinessService>) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBusinessService,
    onSuccess: ({ data }, _payload) => {
      onSuccess(data);
      queryClient.invalidateQueries({ queryKey: [BusinessServicesQueryKey] });
    },
    onError,
  });
};

export const useUpdateBusinessServiceMutation = (
  onSuccess: (payload: BusinessService) => void,
  onError: (err: AxiosError, payload: BusinessService) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBusinessService,
    onSuccess: (_res, payload) => {
      onSuccess(payload);
      queryClient.invalidateQueries({ queryKey: [BusinessServicesQueryKey] });
    },
    onError: onError,
  });
};

export const useDeleteBusinessServiceMutation = (
  onSuccess: (id: number | string) => void,
  onError: (err: AxiosError, id: number | string) => void
) => {
  const queryClient = useQueryClient();

  const { isPending, mutate, error } = useMutation({
    mutationFn: deleteBusinessService,
    onSuccess: (_res, id) => {
      onSuccess(id);
      queryClient.invalidateQueries({ queryKey: [BusinessServicesQueryKey] });
    },
    onError: (err: AxiosError, id) => {
      onError(err, id);
      queryClient.invalidateQueries({ queryKey: [BusinessServicesQueryKey] });
    },
  });
  return {
    mutate,
    isPending,
    error,
  };
};
