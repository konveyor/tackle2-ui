import {
  useMutation,
  useQueries,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";

import { deleteAssessment, getAssessments } from "@app/api/rest";
import { AxiosError, AxiosResponse } from "axios";
import { Application, Assessment } from "@app/api/models";

export const assessmentsQueryKey = "assessments";

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
        const allAssessmentsForApp = response.data;
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
export interface IAssessementMutation {
  id: number;
  name: string;
}

export const useDeleteAssessmentMutation = (
  onSuccess: (name: string) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: IAssessementMutation) => deleteAssessment(args.id),
    onSuccess: (_, args) => {
      onSuccess(args.name);
      queryClient.invalidateQueries([assessmentsQueryKey]);
    },
    onError: onError,
  });
};
