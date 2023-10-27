import React from "react";
import { useTranslation } from "react-i18next";
import { Spinner } from "@patternfly/react-core";

import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { Application } from "@app/api/models";
import { IconedStatus } from "@app/components/IconedStatus";
import { useFetchAssessmentsByItemId } from "@app/queries/assessments";
import { useFetchQuestionnaires } from "@app/queries/questionnaires";

export interface ApplicationAssessmentStatusProps {
  application: Application;
  isLoading?: boolean;
}

export const ApplicationAssessmentStatus: React.FC<
  ApplicationAssessmentStatusProps
> = ({ application, isLoading = false }) => {
  const { t } = useTranslation();

  const {
    assessments,
    isFetching: isFetchingAssessmentsById,
    fetchError,
  } = useFetchAssessmentsByItemId(false, application.id);
  const { questionnaires } = useFetchQuestionnaires();
  const requiredQuestionnaireExists = questionnaires?.some(
    (q) => q.required === true
  );
  //NOTE: Application.assessed is true if an app is assigned to an archetype and no required questionnaires exist
  if (application?.assessed && requiredQuestionnaireExists) {
    return <IconedStatus preset="Completed" />;
  }

  if (fetchError) {
    return <EmptyTextMessage message={t("terms.notAvailable")} />;
  }

  if (isLoading || isFetchingAssessmentsById) {
    return <Spinner size="md" />;
  }

  if (
    assessments?.some((a) => a.status === "started" || a.status === "complete")
  ) {
    return <IconedStatus preset="InProgress" />;
  }

  return <IconedStatus preset="NotStarted" />;
};
