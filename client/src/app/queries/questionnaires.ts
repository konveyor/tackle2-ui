import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import {
  deleteQuestionnaire,
  getQuestionnaireById,
  getQuestionnaires,
  updateQuestionnaire,
} from "@app/api/rest";
import { Questionnaire } from "@app/api/models";

export const QuestionnairesTasksQueryKey = "questionnaires";
export const QuestionnaireByIdQueryKey = "questionnaireById";

export const useFetchQuestionnaires = () => {
  const { isLoading, data, error } = useQuery({
    queryKey: [QuestionnairesTasksQueryKey],
    queryFn: getQuestionnaires,
    onError: (error: AxiosError) => console.log("error, ", error),
  });

  return {
    questionnaires: data || [],
    isFetching: isLoading,
    fetchError: error,
  };
};

export const useUpdateQuestionnaireMutation = (
  onSuccess: () => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateQuestionnaire,

    onSuccess: () => {
      onSuccess();
      queryClient.invalidateQueries([QuestionnairesTasksQueryKey]);
    },
    onError: onError,
  });
};

export const useDeleteQuestionnaireMutation = (
  onSuccess: (questionnaireName: string) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ questionnaire }: { questionnaire: Questionnaire }) =>
      deleteQuestionnaire(questionnaire.id),

    onSuccess: (_, { questionnaire }) => {
      onSuccess(questionnaire.name);
      queryClient.invalidateQueries([QuestionnairesTasksQueryKey]);
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries([QuestionnairesTasksQueryKey]);
    },
  });
};

export const useFetchQuestionnaireById = (id: number | string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: [QuestionnaireByIdQueryKey, id],
    queryFn: () => getQuestionnaireById(id),
    onError: (error: AxiosError) => console.log("error, ", error),
  });
  return {
    questionnaire: data,
    isFetching: isLoading,
    fetchError: error,
  };
};
