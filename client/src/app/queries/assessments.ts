import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createAssessment,
  deleteAssessment,
  getAssessmentById,
  getAssessmentsByItemId,
  updateAssessment,
} from "@app/api/rest";
import { AxiosError } from "axios";
import { Assessment, InitialAssessment } from "@app/api/models";
import { QuestionnairesQueryKey } from "./questionnaires";

export const assessmentsQueryKey = "assessments";
export const assessmentQueryKey = "assessment";
export const assessmentsByItemIdQueryKey = "assessmentsByItemId";

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
      queryClient.invalidateQueries([
        QuestionnairesQueryKey,
        assessmentsByItemIdQueryKey,
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
        assessmentsByItemIdQueryKey,
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

export const useFetchAssessmentsByItemId = (
  isArchetype: boolean,
  itemId?: number | string
) => {
  const { data, isLoading, error } = useQuery({
    queryKey: [assessmentsByItemIdQueryKey, itemId],
    queryFn: () => getAssessmentsByItemId(isArchetype, itemId),
    onError: (error: AxiosError) => console.log("error, ", error),
    onSuccess: (data) => {},
  });

  return {
    assessments: data,
    isFetching: isLoading,
    fetchError: error,
  };
};
