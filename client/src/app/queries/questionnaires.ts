import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import {
  createQuestionnaire,
  deleteQuestionnaire,
  downloadQuestionnaire,
  getQuestionnaires,
  updateQuestionnaire,
} from "@app/api/rest";
import { Questionnaire } from "@app/api/models";

export const QuestionnairesQueryKey = "questionnaires";
export const QuestionnaireByIdQueryKey = "questionnaireById";

export const useFetchQuestionnaires = () => {
  const { isLoading, data, error } = useQuery({
    queryKey: [QuestionnairesQueryKey],
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
      queryClient.invalidateQueries([QuestionnairesQueryKey]);
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
      queryClient.invalidateQueries([QuestionnairesQueryKey]);
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries([QuestionnairesQueryKey]);
    },
  });
};

// The questionnaire download is triggered on demand by a refetch()
export const useFetchQuestionnaireById = (
  id: number,
  onError: (err: AxiosError) => void
) =>
  useQuery({
    queryKey: [QuestionnaireByIdQueryKey, id],
    queryFn: () => downloadQuestionnaire(id),
    onError: onError,
    enabled: false,
  });

export const useCreateQuestionnaireMutation = (
  onSuccess?: (res: Questionnaire) => void,
  onError?: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isLoading, mutate, mutateAsync, error } = useMutation(
    createQuestionnaire,
    {
      onSuccess: (res) => {
        onSuccess && onSuccess(res);
        queryClient.invalidateQueries([]);
      },
      onError: (err: AxiosError) => {
        onError && onError(err);
      },
    }
  );
  return {
    mutate,
    mutateAsync,
    isLoading,
    error,
  };
};
