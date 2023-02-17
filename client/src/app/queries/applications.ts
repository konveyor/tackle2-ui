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
  const { data, isLoading, error, refetch } = useQuery(
    [ApplicationsQueryKey],
    getApplications,
    {
      onSuccess: (data: Application[]) => {
        queryClient.invalidateQueries([reviewsQueryKey]);
        queryClient.invalidateQueries([assessmentsQueryKey]);
      },
      onError: (error) => console.log(error),
    }
  );
  return {
    applications: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useUpdateApplicationMutation = (
  onSuccess: (res: any) => void,
  onError: (err: Error | unknown) => void
) => {
  const queryClient = useQueryClient();
  const { isLoading, mutate, error } = useMutation(updateApplication, {
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([ApplicationsQueryKey]);
    },
    onError: (err) => {
      onError(err);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};

export const useUpdateAllApplicationsMutation = (
  onSuccess: (res: any) => void,
  onError: (err: Error | unknown) => void
) => {
  const queryClient = useQueryClient();
  const { isLoading, mutate, error } = useMutation(updateAllApplications, {
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([ApplicationsQueryKey]);
    },
    onError: (err) => {
      onError(err);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};

export const useCreateApplicationMutation = (
  onSuccess: (res: any) => void,
  onError: (err: Error | unknown) => void
) => {
  const queryClient = useQueryClient();
  const { isLoading, mutate, error } = useMutation(createApplication, {
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([ApplicationsQueryKey]);
    },
    onError: (err) => {
      onError(err);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};

export const useDeleteApplicationMutation = (
  onSuccess: (numberOfApps: number) => void,
  onError: (err: Error | unknown) => void
) => {
  const queryClient = useQueryClient();
  return useMutation(({ id }: { id: number }) => deleteApplication(id), {
    onSuccess: (res) => {
      onSuccess(1);
      queryClient.invalidateQueries([ApplicationsQueryKey]);
    },
    onError: (err) => {
      onError(err);
    },
  });
};

export const useBulkDeleteApplicationMutation = (
  onSuccess: (numberOfApps: number) => void,
  onError: (err: Error | unknown) => void
) => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ ids }: { ids: number[] }) => deleteBulkApplications(ids),
    {
      onSuccess: (res, vars) => {
        onSuccess(vars.ids.length);
        queryClient.invalidateQueries([ApplicationsQueryKey]);
      },
      onError: (err) => {
        onError(err);
      },
    }
  );
};
