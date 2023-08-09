import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { getQuestionnaires, updateQuestionnaire } from "@app/api/rest";
import { Questionnaire } from "@app/api/models";

export const QuestionnairesTasksQueryKey = "questionnaires";

// TOD Replace when Hub API is ready
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
//     fetchError: error as AxiosError,
//   };
// };

// TOD Replace when Hub API is ready
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
  onSuccess: () => void,
  onError: (err: AxiosError) => void
) => {
  return {
    mutationFn: mockUpdateQuestionnaire,
    onSuccess: () => {
      onSuccess();
    },
    onError: onError,
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
