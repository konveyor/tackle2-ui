import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createAssessment,
  deleteAssessment,
  getAssessmentById,
  getAssessments,
  getAssessmentsByItemId,
  updateAssessment,
} from "@app/api/rest";
import { AxiosError } from "axios";
import { Assessment, InitialAssessment } from "@app/api/models";
import { QuestionnairesQueryKey } from "./questionnaires";
import { ARCHETYPE_QUERY_KEY } from "./archetypes";

export const assessmentsQueryKey = "assessments";
export const assessmentQueryKey = "assessment";
export const assessmentsByItemIdQueryKey = "assessmentsByItemId";

export const useFetchAssessments = () => {
  const { isLoading, data, error } = useQuery({
    queryKey: [assessmentsQueryKey],
    queryFn: getAssessments,
    onError: (error: AxiosError) => console.log("error, ", error),
  });
  return {
    assessments: data || [],
    isFetching: isLoading,
    fetchError: error,
  };
};

export const useCreateAssessmentMutation = (
  isArchetype: boolean,
  onSuccess: (name: string) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assessment: InitialAssessment) =>
      createAssessment(assessment, isArchetype),
    onSuccess: (res) => {
      queryClient.invalidateQueries([
        assessmentsByItemIdQueryKey,
        res?.application?.id,
        res?.archetype?.id,
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
      queryClient.invalidateQueries([QuestionnairesQueryKey]);
      queryClient.invalidateQueries([
        assessmentsByItemIdQueryKey,
        args.application?.id,
      ]);
      queryClient.invalidateQueries([
        assessmentsByItemIdQueryKey,
        args.archetype?.id,
      ]);
    },
    onError: onError,
  });
};

export const useDeleteAssessmentMutation = (
  onSuccess?: (applicationName: string) => void,
  onError?: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: {
      assessmentId: number;
      applicationName?: string;
      applicationId?: number;
      archetypeId?: number;
    }) => {
      const deletedAssessment = deleteAssessment(args.assessmentId);

      queryClient.invalidateQueries([assessmentQueryKey, args?.assessmentId]);
      queryClient.invalidateQueries([ARCHETYPE_QUERY_KEY, args?.archetypeId]);
      queryClient.invalidateQueries([
        assessmentsByItemIdQueryKey,
        args?.archetypeId,
      ]);
      queryClient.invalidateQueries([
        assessmentsByItemIdQueryKey,
        args?.applicationId,
      ]);

      return deletedAssessment;
    },
    onSuccess: (_, args) => {
      onSuccess && onSuccess(args?.applicationName || "Unknown");
    },
    onError: onError,
  });
};

export const useFetchAssessmentById = (id?: number | string) => {
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: [assessmentQueryKey, id],
    queryFn: () => (id ? getAssessmentById(id) : undefined),
    onError: (error: AxiosError) => console.log("error, ", error),
    enabled: !!id,
  });
  return {
    assessment: data,
    isFetching: isLoading || isFetching,
    fetchError: error,
  };
};

export const useFetchAssessmentsByItemId = (
  isArchetype: boolean,
  itemId?: number | string
) => {
  const { data, isLoading, error } = useQuery({
    queryKey: [assessmentsByItemIdQueryKey, itemId, isArchetype],
    queryFn: () => getAssessmentsByItemId(isArchetype, itemId),
    onError: (error: AxiosError) => console.log("error, ", error),
    onSuccess: (_data) => {},
    enabled: !!itemId,
  });

  return {
    assessments: data,
    isFetching: isLoading,
    fetchError: error,
  };
};
