import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

// TODO Uncomment when Hub API is ready
import {
  deleteQuestionnaire,
  getQuestionnaires,
  updateQuestionnaire,
} from "@app/api/rest";
import { Questionnaire } from "@app/api/models";

export const QuestionnairesTasksQueryKey = "questionnaires";

// TODO Replace when Hub API is ready
export const useFetchQuestionnaires = (mockQuestionnaires: Questionnaire[]) => {
  return {
    questionnaires: mockQuestionnaires,
    isFetching: false,
    fetchError: null,
  };
};

// export const useFetchQuestionnaires = () => {
//   const { isLoading, data, error } = useQuery({
//     queryKey: [QuestionnairesTasksQueryKey],
//     queryFn: getQuestionnaires,
//     onError: (error) => console.log("error, ", error),
//   });
//   return {
//     questionnaires: data || [],
//     isFetching: isLoading,
//     fetchError: error as AxiosErr_event
// TODO Replace when Hub API is ready
const mockUpdateQuestionnaire = (
  obj: Questionnaire,
  mockQuestionnaires: Questionnaire[],
  setMockQuestionnaires: (questionnaires: Questionnaire[]) => void
) => {
  const newMockQuestionnaires = mockQuestionnaires.map((questionnaire) =>
    questionnaire.id === obj.id ? obj : questionnaire
  );
  setMockQuestionnaires(newMockQuestionnaires);
};

export const useUpdateQuestionnaireMutation = (
  _onSuccess: () => void,
  _onError: (err: AxiosError) => void
) => {
  return {
    mutationFn: mockUpdateQuestionnaire,
  };
};

// export const useUpdateQuestionnaireMutation = (
//   onSuccess: () => void,
//   onError: (err: AxiosError) => void
// ) => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: updateQuestionnaire,
//     onSuccess: () => {
//       onSuccess();
//       queryClient.invalidateQueries([QuestionnairesTasksQueryKey]);
//     },
//     onError: onError,
//   });
// };

// TODO Replace when Hub API is ready
const mockDeleteQuestionnaire = (
  id: number,
  mockQuestionnaires: Questionnaire[],
  setMockQuestionnaires: (questionnaires: Questionnaire[]) => void
) => {
  const newMockQuestionnaires = mockQuestionnaires.filter(
    (questionnaire) => questionnaire.id !== id
  );
  setMockQuestionnaires(newMockQuestionnaires);
};

export const useDeleteQuestionnaireMutation = (
  _onSuccess: (name: string) => void,
  _onError: (err: AxiosError) => void
) => {
  return {
    mutationFn: mockDeleteQuestionnaire,
  };
};

// export const useDeleteQuestionnaireMutation = (
//   onSuccess: (name: string) => void,
//   onError: (err: AxiosError) => void
// ) => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({ questionnaire }: { questionnaire: Questionnaire }) =>
//       deleteQuestionnaire(questionnaire.id),
//     onSuccess: (_, vars) => {
//       onSuccess(vars.questionnaire.name);
//       queryClient.invalidateQueries([QuestionnairesTasksQueryKey]);
//     },
//     onError: (err: AxiosError) => {
//       onError(err);
//       queryClient.invalidateQueries([QuestionnairesTasksQueryKey]);
//     },
//   });
// };
