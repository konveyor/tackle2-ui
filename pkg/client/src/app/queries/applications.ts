import { useState } from "react";
import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "react-query";

import { Application } from "@app/api/models";
import {
  createApplication,
  deleteApplication,
  getApplicationsQuery,
  updateAllApplications,
  updateApplication,
} from "@app/api/rest";
import { AxiosError } from "axios";
import { reviewsQueryKey } from "./reviews";

export interface IApplicationMutateState {
  mutate: any;
  isLoading: boolean;
  error: any;
}
export const ApplicationsQueryKey = "applications";

export const useFetchApplications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const queryClient = useQueryClient();
  const { isLoading, error, refetch } = useQuery(
    ApplicationsQueryKey,
    getApplicationsQuery,
    {
      onSuccess: (data: Application[]) => {
        setApplications(data);
        queryClient.invalidateQueries(reviewsQueryKey);
      },
      onError: (err: Error) => {
        console.log(error);
      },
    }
  );
  return {
    applications,
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useUpdateApplicationMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
): IApplicationMutateState => {
  const queryClient = useQueryClient();
  const { isLoading, mutate, error } = useMutation(updateApplication, {
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries(ApplicationsQueryKey);
    },
    onError: (err: AxiosError) => {
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
  onError: (err: AxiosError) => void
): IApplicationMutateState => {
  const queryClient = useQueryClient();
  const { isLoading, mutate, error } = useMutation(updateAllApplications, {
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries(ApplicationsQueryKey);
    },
    onError: (err: AxiosError) => {
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
  onError: (err: AxiosError) => void
): IApplicationMutateState => {
  const queryClient = useQueryClient();
  const { isLoading, mutate, error } = useMutation(createApplication, {
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries(ApplicationsQueryKey);
    },
    onError: (err: AxiosError) => {
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
  onSuccess: () => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation(deleteApplication, {
    onSuccess: () => {
      onSuccess();
      queryClient.invalidateQueries(ApplicationsQueryKey);
    },
    onError: (err: AxiosError) => {
      onError(err);
    },
  });
};
