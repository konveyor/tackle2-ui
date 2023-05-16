import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Application, ApplicationDependency } from "@app/api/models";
import {
  createApplication,
  deleteApplication,
  deleteBulkApplications,
  getApplications,
  updateAllApplications,
  updateApplication,
} from "@app/api/rest";
import { reviewsQueryKey } from "./reviews";
import { assessmentsQueryKey } from "./assessments";
import { AxiosError } from "axios";

export interface IApplicationDependencyFetchState {
  applicationDependencies: ApplicationDependency[];
  isFetching: boolean;
  fetchError: any;
  refetch: any;
}

export const ApplicationDependencyQueryKey = "applicationdependencies";
export const ApplicationsQueryKey = "applications";

export const useFetchApplications = () => {
  const queryClient = useQueryClient();
  const { isLoading, error, refetch, data } = useQuery({
    initialData: [],
    queryKey: [ApplicationsQueryKey],
    queryFn: getApplications,
    onSuccess: () => {
      queryClient.invalidateQueries([reviewsQueryKey]);
      queryClient.invalidateQueries([assessmentsQueryKey]);
    },
    onError: (error: AxiosError) => console.log(error),
  });
  return {
    data: data || [],
    isFetching: isLoading,
    error,
    refetch,
  };
};

export const useUpdateApplicationMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateApplication,
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([ApplicationsQueryKey]);
    },
    onError: onError,
  });
};

export const useUpdateAllApplicationsMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAllApplications,
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([ApplicationsQueryKey]);
    },
    onError: onError,
  });
};

export const useCreateApplicationMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createApplication,
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([ApplicationsQueryKey]);
    },
    onError: onError,
  });
};

export const useDeleteApplicationMutation = (
  onSuccess: (id: number) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation(({ id }: { id: number }) => deleteApplication(id), {
    onSuccess: (res) => {
      onSuccess(1);
      queryClient.invalidateQueries([ApplicationsQueryKey]);
    },
    onError: onError,
  });
};

export const useBulkDeleteApplicationMutation = (
  onSuccess: (numberOfApps: number) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ ids }: { ids: number[] }) => deleteBulkApplications(ids),
    {
      onSuccess: (res, vars) => {
        onSuccess(vars.ids.length);
        queryClient.invalidateQueries([ApplicationsQueryKey]);
      },
      onError: onError,
    }
  );
};
