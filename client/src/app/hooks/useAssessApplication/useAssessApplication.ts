import { useCallback, useState } from "react";
import { AxiosError } from "axios";

import { createAssessment, getAssessments } from "@app/api/rest";
import { Application, Assessment, InitialAssessment } from "@app/api/models";

export interface IState {
  inProgress: boolean;
  getCurrentAssessment: (
    application: Application,
    onSuccess: (assessment?: Assessment) => void,
    onError: (error: AxiosError) => void
  ) => void;
  assessApplication: (
    application: Application,
    onSuccess: (assessment: Assessment) => void,
    onError: (error: AxiosError) => void
  ) => void;
}

export const useAssessApplication = (): IState => {
  const [inProgress, setInProgress] = useState(false);

  const getCurrentAssessmentHandler = useCallback(
    (
      application: Application,
      onSuccess: (assessment?: Assessment) => void,
      onError: (error: AxiosError) => void
    ) => {
      if (!application.id) {
        console.log("Entity must have 'id' to execute this operationn");
        return;
      }

      setInProgress(true);
      getAssessments({ applicationId: application.id })
        .then((data) => {
          const currentAssessment: Assessment | undefined = data[0]
            ? data[0]
            : undefined;

          setInProgress(false);
          onSuccess(currentAssessment);
        })
        .catch((error: AxiosError) => {
          setInProgress(false);
          onError(error);
        });
    },
    []
  );

  const assessApplicationHandler = useCallback(
    (
      application: Application,
      onSuccess: (assessment: Assessment) => void,
      onError: (error: AxiosError) => void
    ) => {
      if (!application.id) {
        console.log("Entity must have 'id' to execute this operation");
        return;
      }

      setInProgress(true);
      getAssessments({ applicationId: application.id })
        .then((data) => {
          const currentAssessment: Assessment | undefined = data[0];

          const newAssessment: InitialAssessment = {
            application: { id: application.id, name: application.name },
            questionnaire: { id: 1, name: "Sample Questionnaire" },
          };

          return Promise.all([
            currentAssessment,
            !currentAssessment ? createAssessment(newAssessment) : undefined,
          ]);
        })
        .then(([currentAssessment, newAssessment]) => {
          setInProgress(false);
          onSuccess(currentAssessment || newAssessment!);
        })
        .catch((error: AxiosError) => {
          setInProgress(false);
          onError(error);
        });
    },
    []
  );

  return {
    inProgress: inProgress,
    getCurrentAssessment: getCurrentAssessmentHandler,
    assessApplication: assessApplicationHandler,
  };
};

export default useAssessApplication;
