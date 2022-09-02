import { useMutation, useQuery, useQueryClient } from "react-query";
import { JobFunction } from "@app/api/models";
import { deleteJobFunction, getJobFunctions } from "@app/api/rest";
import { AxiosError } from "axios";

export interface IJobFunctionFetchState {
  jobFunctions: JobFunction[];
  isFetching: boolean;
  fetchError: any;
  refetch: any;
}
export const JobFunctionsQueryKey = "jobfunctions";

export const useFetchJobFunctions = (): IJobFunctionFetchState => {
  const { data, isLoading, error, refetch } = useQuery(
    JobFunctionsQueryKey,
    async () => (await getJobFunctions()).data,
    {
      onError: (error) => console.log("error, ", error),
    }
  );
  return {
    jobFunctions: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useDeleteJobFunctionMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  const { isLoading, mutate, error } = useMutation(deleteJobFunction, {
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries(JobFunctionsQueryKey);
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries(JobFunctionsQueryKey);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};
