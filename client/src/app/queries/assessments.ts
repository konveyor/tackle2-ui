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
  getAssessmentsByAppId,
  updateAssessment,
} from "@app/api/rest";
import { AxiosError } from "axios";
import { Application, Assessment, InitialAssessment } from "@app/api/models";
import { QuestionnairesQueryKey } from "./questionnaires";

export const assessmentsQueryKey = "assessments";
export const assessmentQueryKey = "assessment";
export const assessmentsByAppIdQueryKey = "assessmentsByAppId";

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
      onError: (error: AxiosError) => console.log("error, ", error),
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
    onSuccess: (res) => {
      queryClient.invalidateQueries([
        assessmentsByAppIdQueryKey,
        res?.application?.id,
      ]);
    },
    onError: onError,
  });
};

export const useUpdateAssessmentMutation = (
  onSuccess?: (name: string) => void,
  onError?: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assessment: Assessment) => updateAssessment(assessment),
    onSuccess: (_, args) => {
      onSuccess && onSuccess(args.name);
      queryClient.invalidateQueries([
        QuestionnairesQueryKey,
        assessmentsByAppIdQueryKey,
        _?.application?.id,
      ]);
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
      queryClient.invalidateQueries([
        assessmentsByAppIdQueryKey,
        args.id,
        QuestionnairesQueryKey,
      ]);
    },
    onError: onError,
  });
};

export const useFetchAssessmentById = (id: number | string) => {
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

export const useFetchAssessmentsByAppId = (applicationId: number | string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: [assessmentsByAppIdQueryKey, applicationId],
    queryFn: () => getAssessmentsByAppId(applicationId),
    onError: (error: AxiosError) => console.log("error, ", error),
    onSuccess: (data) => {},
  });
  return {
    assessments: data,
    isFetching: isLoading,
    fetchError: error,
  };
};
