import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { JobFunction } from "@app/api/models";
import {
  createJobFunction,
  deleteJobFunction,
  getJobFunctions,
  updateJobFunction,
} from "@app/api/rest";
import { AxiosError } from "axios";

export interface IJobFunctionFetchState {
  jobFunctions: JobFunction[];
  isFetching: boolean;
  fetchError: any;
  refetch: any;
}
export const JobFunctionsQueryKey = "jobfunctions";

export const useFetchJobFunctions = (): IJobFunctionFetchState => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [JobFunctionsQueryKey],
    queryFn: getJobFunctions,
    onError: (error: AxiosError) => console.log("error, ", error),
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
      queryClient.invalidateQueries([JobFunctionsQueryKey]);
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
      queryClient.invalidateQueries([JobFunctionsQueryKey]);
    },
    onError: onError,
  });
};

export const useDeleteJobFunctionMutation = (
  onSuccess: (res: JobFunction) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  const { isLoading, mutate, error } = useMutation({
    mutationFn: deleteJobFunction,
    onSuccess: (data) => {
      onSuccess(data);
      queryClient.invalidateQueries([JobFunctionsQueryKey]);
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries([JobFunctionsQueryKey]);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};
