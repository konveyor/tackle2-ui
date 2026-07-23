import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { saveAs } from "file-saver";
import * as yaml from "js-yaml";

import { LooseQuestionnaire, Questionnaire } from "@app/api/models";
import {
  QUESTIONNAIRES,
  createQuestionnaire,
  deleteQuestionnaire,
  getQuestionnaireById,
  getQuestionnaires,
  updateQuestionnaire,
} from "@app/api/rest";

export const QuestionnairesQueryKey = "questionnaires";
const QuestionnaireByIdQueryKey = "questionnaireById";

export const useFetchQuestionnaires = (
  refetchInterval: number | false = false
) => {
  const { isLoading, data, error } = useQuery({
    queryKey: [QuestionnairesQueryKey],
    queryFn: getQuestionnaires,
    onError: (error: AxiosError) => console.log("error, ", error),
    refetchInterval,
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
      queryClient.invalidateQueries({ queryKey: [QuestionnairesQueryKey] });
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
      queryClient.invalidateQueries({ queryKey: [QuestionnairesQueryKey] });
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries({ queryKey: [QuestionnairesQueryKey] });
    },
  });
};

export const useFetchQuestionnaireById = (
  id: number | string,
  refetchInterval: number | false = false
) => {
  const { data, isLoading, error } = useQuery({
    queryKey: [QuestionnaireByIdQueryKey, id],
    queryFn: () => getQuestionnaireById(id),
    onError: (error: AxiosError) => console.log("error, ", error),
    refetchInterval,
  });

  return {
    questionnaire: data,
    isFetching: isLoading,
    fetchError: error,
  };
};

export const useCreateQuestionnaireMutation = (
  onSuccess?: (res: Questionnaire) => void,
  onError?: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isPending, mutate, mutateAsync, error } = useMutation({
    mutationFn: createQuestionnaire,
    onSuccess: (res) => {
      onSuccess?.(res);
      queryClient.invalidateQueries({ queryKey: [QuestionnairesQueryKey] });
    },
    onError: (err: AxiosError) => {
      onError?.(err);
    },
  });
  return {
    mutate,
    mutateAsync,
    isPending,
    error,
  };
};

const downloadQuestionnaire = async (id: number | string): Promise<void> => {
  const url = `${QUESTIONNAIRES}/${id}`;

  try {
    const response = await axios.get(url, {
      responseType: "text",
      headers: {
        Accept: "application/x-yaml",
      },
    });

    if (response.status !== 200) {
      throw new Error("Network response was not ok when downloading file.");
    }

    const yamlData = yaml.load(response.data) as LooseQuestionnaire;

    delete yamlData.createUser;
    delete yamlData.updateUser;
    delete yamlData.createTime;
    delete yamlData.id;
    delete yamlData.required;
    delete yamlData.builtin;

    const newYamlData = yaml.dump(yamlData);

    const blob = new Blob([newYamlData], { type: "application/x-yaml" });

    saveAs(blob, `questionnaire-${id}.yaml`);
  } catch (error) {
    console.error("There was an error downloading the file:", error);
    throw error;
  }
};

export const useDownloadQuestionnaire = () => {
  return useMutation({ mutationFn: downloadQuestionnaire });
};
