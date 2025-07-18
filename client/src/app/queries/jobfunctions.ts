import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { JobFunction } from "@app/api/models";
import {
  createJobFunction,
  deleteJobFunction,
  getJobFunctions,
  updateJobFunction,
} from "@app/api/rest";
import { AxiosError } from "axios";
import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";

export const JobFunctionsQueryKey = "jobfunctions";

export const useFetchJobFunctions = (
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [JobFunctionsQueryKey],
    queryFn: getJobFunctions,
    onError: (error: AxiosError) => console.log("error, ", error),
    refetchInterval,
  });
  return {
    jobFunctions: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useCreateJobFunctionMutation = (
  onSuccess: (data: JobFunction) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createJobFunction,
    onSuccess: (data) => {
      onSuccess(data);
      queryClient.invalidateQueries({ queryKey: [JobFunctionsQueryKey] });
    },
    onError,
  });
};

export const useUpdateJobFunctionMutation = (
  onSuccess: () => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateJobFunction,
    onSuccess: () => {
      onSuccess();
      queryClient.invalidateQueries({ queryKey: [JobFunctionsQueryKey] });
    },
    onError: onError,
  });
};

export const useDeleteJobFunctionMutation = (
  onSuccess: (res: JobFunction) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  const { isPending, mutate, error } = useMutation({
    mutationFn: deleteJobFunction,
    onSuccess: (data) => {
      onSuccess(data);
      queryClient.invalidateQueries({ queryKey: [JobFunctionsQueryKey] });
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries({ queryKey: [JobFunctionsQueryKey] });
    },
  });
  return {
    mutate,
    isPending,
    error,
  };
};
