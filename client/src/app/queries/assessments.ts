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
      const isArchetype = !!res?.archetype?.id;
      queryClient.invalidateQueries([
        assessmentsByItemIdQueryKey,
        res?.application?.id,
        isArchetype,
      ]);
      queryClient.invalidateQueries([
        assessmentsByItemIdQueryKey,
        res?.archetype?.id,
        isArchetype,
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
      const isArchetype = !!args.archetype?.id;

      queryClient.invalidateQueries([QuestionnairesQueryKey]);

      queryClient.invalidateQueries([
        assessmentsByItemIdQueryKey,
        args.application?.id,
        isArchetype,
      ]);
      queryClient.invalidateQueries([
        assessmentsByItemIdQueryKey,
        args.archetype?.id,
        isArchetype,
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
      const isArchetype = !!args.archetypeId;

      queryClient.invalidateQueries([assessmentQueryKey, args?.assessmentId]);
      queryClient.invalidateQueries([ARCHETYPE_QUERY_KEY, args?.archetypeId]);
      queryClient.invalidateQueries([
        assessmentsByItemIdQueryKey,
        args?.archetypeId,
        isArchetype,
      ]);
      queryClient.invalidateQueries([
        assessmentsByItemIdQueryKey,
        args?.applicationId,
        isArchetype,
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
    refetchOnWindowFocus: false,
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

  const queryClient = useQueryClient();

  const invalidateAssessmentsQuery = () => {
    queryClient.invalidateQueries([
      assessmentsByItemIdQueryKey,
      itemId,
      isArchetype,
    ]);
  };

  return {
    assessments: data,
    isFetching: isLoading,
    fetchError: error,
    invalidateAssessmentsQuery,
  };
};
