import { useMutation } from "react-query";

import { deleteAssessment } from "@app/api/rest";
import { AxiosError } from "axios";

export const useDeleteAssessmentMutation = (
  onSuccess?: () => void,
  onError?: (err: AxiosError) => void
) => {
  return useMutation(deleteAssessment, {
    onSuccess: () => {
      onSuccess && onSuccess();
    },
    onError: (err: AxiosError) => {
      onError && onError(err);
    },
  });
};
