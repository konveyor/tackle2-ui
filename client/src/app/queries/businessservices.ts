import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import {
  createBusinessService,
  deleteBusinessService,
  getBusinessServiceById,
  getBusinessServices,
  updateBusinessService,
} from "@app/api/rest";
import { BusinessService, New } from "@app/api/models";

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

export const useFetchBusinessServiceById = (id: number | string) => {
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
  onSuccess: (res: BusinessService) => void,
  onError: (err: AxiosError, payload: New<BusinessService>) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBusinessService,
    onSuccess: ({ data }, _payload) => {
      onSuccess(data);
      queryClient.invalidateQueries([BusinessServicesQueryKey]);
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
      queryClient.invalidateQueries([BusinessServicesQueryKey]);
    },
    onError: onError,
  });
};

export const useDeleteBusinessServiceMutation = (
  onSuccess: (id: number | string) => void,
  onError: (err: AxiosError, id: number | string) => void
) => {
  const queryClient = useQueryClient();

  const { isLoading, mutate, error } = useMutation({
    mutationFn: deleteBusinessService,
    onSuccess: (_res, id) => {
      onSuccess(id);
      queryClient.invalidateQueries([BusinessServicesQueryKey]);
    },
    onError: (err: AxiosError, id) => {
      onError(err, id);
      queryClient.invalidateQueries([BusinessServicesQueryKey]);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};
