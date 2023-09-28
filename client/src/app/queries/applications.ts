import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { Application, MimeType } from "@app/api/models";
import {
  createApplication,
  deleteApplication,
  deleteBulkApplications,
  getApplicationAnalysis,
  getApplicationById,
  getApplications,
  updateAllApplications,
  updateApplication,
} from "@app/api/rest";
import { reviewsQueryKey } from "./reviews";
import { assessmentsQueryKey } from "./assessments";

export const ApplicationDependencyQueryKey = "applicationdependencies";
export const ApplicationsQueryKey = "applications";
export const ReportQueryKey = "report";

export const useFetchApplications = () => {
  const queryClient = useQueryClient();
  const { isLoading, error, refetch, data } = useQuery({
    initialData: [],
    queryKey: [ApplicationsQueryKey],
    queryFn: getApplications,
    refetchInterval: 5000,
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

export const ApplicationQueryKey = "application";

export const useFetchApplicationById = (id?: number | string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: [ApplicationQueryKey, id],
    queryFn: () =>
      id === undefined ? Promise.resolve(undefined) : getApplicationById(id),
    onError: (error: AxiosError) => console.log("error, ", error),
    enabled: id !== undefined,
  });

  return {
    application: data,
    isFetching: isLoading,
    fetchError: error,
  };
};

export const useUpdateApplicationMutation = (
  onSuccess: (payload: Application) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateApplication,
    onSuccess: (_res, payload) => {
      onSuccess(payload);
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
  onSuccess: (data: Application) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createApplication,
    onSuccess: ({ data }) => {
      onSuccess(data);
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

// The report download is triggerred on demand by a refetch()
export const useFetchStaticReport = (
  id: number,
  type: MimeType,
  onError: (err: AxiosError) => void
) =>
  useQuery({
    queryKey: [ReportQueryKey, id],
    queryFn: () => getApplicationAnalysis(id, type),
    onError: onError,
    enabled: false,
  });
