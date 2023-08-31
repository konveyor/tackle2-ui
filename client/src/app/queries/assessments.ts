import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";

import {
  createAssessment,
  deleteAssessment,
  getAssessmentById,
  getAssessments,
} from "@app/api/rest";
import { AxiosError, AxiosResponse } from "axios";
import { Application, Assessment, InitialAssessment } from "@app/api/models";

export const assessmentsQueryKey = "assessments";
export const assessmentQueryKey = "assessment";

export const useFetchApplicationAssessments = (
  applications: Application[] = []
) => {
  const queryResults = useQueries({
    queries: applications.map((application) => ({
      queryKey: [assessmentsQueryKey, application.id],
      queryFn: async () => {
        const response = await getAssessments({
          applicationId: application.id,
        });
        const allAssessmentsForApp = response;
        return allAssessmentsForApp[0] || [];
      },
      onError: (error: any) => console.log("error, ", error),
    })),
  });
  const queryResultsByAppId: Record<number, UseQueryResult<Assessment>> = {};
  applications.forEach((application, i) => {
    if (application.id) queryResultsByAppId[application.id] = queryResults[i];
  });
  return {
    getApplicationAssessment: (id: number) => queryResultsByAppId[id]?.data,
    isLoadingApplicationAssessment: (id: number) =>
      queryResultsByAppId[id].isLoading,
    fetchErrorApplicationAssessment: (id: number) =>
      queryResultsByAppId[id].error as AxiosError | undefined,
  };
};

export const useCreateAssessmentMutation = (
  onSuccess: (name: string) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assessment: InitialAssessment) => createAssessment(assessment),
    onSuccess: (_, args) => {
      // onSuccess(args.);
      //TODO determine what to return here and how to handle
      queryClient.invalidateQueries([assessmentsQueryKey]);
    },
    onError: onError,
  });
};

export const useDeleteAssessmentMutation = (
  onSuccess: (name: string) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: { name: string; id: number }) =>
      deleteAssessment(args.id),
    onSuccess: (_, args) => {
      onSuccess(args.name);
      queryClient.invalidateQueries([assessmentsQueryKey]);
    },
    onError: onError,
  });
};

export const useFetchAssessmentByID = (id: number | string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: [assessmentQueryKey, id],
    queryFn: () => getAssessmentById(id),
    onError: (error: AxiosError) => console.log("error, ", error),
  });
  return {
    assessment: data,
    isFetching: isLoading,
    fetchError: error,
  };
};
