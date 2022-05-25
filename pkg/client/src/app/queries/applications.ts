import { useMutation, useQuery, useQueryClient } from "react-query";

import { Application, Assessment } from "@app/api/models";
import {
  createApplication,
  deleteApplication,
  getApplicationsQuery,
  updateAllApplications,
  updateApplication,
} from "@app/api/rest";
import { AxiosError } from "axios";
import { reviewsQueryKey } from "./reviews";
import { useDeleteAssessmentMutation } from "./assessments";

export interface IApplicationMutateState {
  mutate: any;
  isLoading: boolean;
  error: any;
}
export const ApplicationsQueryKey = "applications";

export const useFetchApplications = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery(
    ApplicationsQueryKey,
    getApplicationsQuery,
    {
      onSuccess: (data: Application[]) => {
        queryClient.invalidateQueries(reviewsQueryKey);
      },
      onError: (err: Error) => console.log(error),
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
  onError: (err: AxiosError) => void,
  getApplicationAssessment?: (id: number) => Assessment | undefined
) => {
  const queryClient = useQueryClient();
  const { mutate: mutateAssessments } = useDeleteAssessmentMutation();
  return useMutation(({ id }: { id: number }) => deleteApplication(id), {
    onSuccess: (_, { id }) => {
      onSuccess();
      queryClient.invalidateQueries(ApplicationsQueryKey);
      const assessment =
        getApplicationAssessment && getApplicationAssessment(id);
      if (assessment?.id) {
        mutateAssessments(assessment?.id);
      }
    },
    onError: (err: AxiosError) => {
      onError(err);
    },
  });
};
