import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import yaml from "js-yaml";

import {
  QUESTIONNAIRES,
  createQuestionnaire,
  deleteQuestionnaire,
  getQuestionnaireById,
  getQuestionnaires,
  updateQuestionnaire,
} from "@app/api/rest";
import { LooseQuestionnaire, Questionnaire } from "@app/api/models";
import saveAs from "file-saver";

export const QuestionnairesQueryKey = "questionnaires";
export const QuestionnaireByIdQueryKey = "questionnaireById";

/**
 * For a Questionnaire, walk the structure and sort lists by order if the items
 * in that list have an order.  Hub stores things in the document order not logical
 * order.  UI needs to have things in logical order.
 */
//TODO: this is not working, need to figure out why https://issues.redhat.com/browse/MTA-1907
// function inPlaceSortByOrder(q: Questionnaire) {
//   q.sections.sort((a, b) => a.order - b.order);
//   q.sections.forEach((s) => {
//     s.questions.sort((a, b) => a.order - b.order);
//     s.questions.forEach((q) => {
//       q.answers.sort((a, b) => a.order - b.order);
//     });
//   });
//   return q;
// }

export const useFetchQuestionnaires = () => {
  const { isLoading, data, error } = useQuery({
    queryKey: [QuestionnairesQueryKey],
    queryFn: getQuestionnaires,
    onError: (error: AxiosError) => console.log("error, ", error),
    // select: (questionnaires) => {
    //   questionnaires.forEach((q) => inPlaceSortByOrder(q));
    //   return questionnaires;
    // },
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

export const useFetchQuestionnaireById = (id: number | string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: [QuestionnaireByIdQueryKey, id],
    queryFn: () => getQuestionnaireById<Questionnaire>(id),
    onError: (error: AxiosError) => console.log("error, ", error),
    // select: (q) => inPlaceSortByOrder(q),
  });

  return {
    questionnaire: data,
    isFetching: isLoading,
    fetchError: error,
  };
};

// A questionnaire download is triggered on demand using refetch()
export const useFetchQuestionnaireBlob = (
  id: number,
  onError: (err: AxiosError) => void
) =>
  useQuery({
    queryKey: [QuestionnaireByIdQueryKey, id],
    queryFn: () => getQuestionnaireById<Blob>(id),
    onError: onError,
    enabled: false,
  });

export const useCreateQuestionnaireMutation = (
  onSuccess?: (res: Questionnaire) => void,
  onError?: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isLoading, mutate, mutateAsync, error } = useMutation({
    mutationFn: createQuestionnaire,
    onSuccess: (res) => {
      onSuccess && onSuccess(res);
      queryClient.invalidateQueries([]);
    },
    onError: (err: AxiosError) => {
      onError && onError(err);
    },
  });
  return {
    mutate,
    mutateAsync,
    isLoading,
    error,
  };
};

export const downloadQuestionnaire = async (
  id: number | string
): Promise<void> => {
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
