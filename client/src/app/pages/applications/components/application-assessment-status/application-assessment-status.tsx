import React from "react";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import { Spinner } from "@patternfly/react-core";

import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { Assessment, Ref } from "@app/api/models";
import { IconedStatus, IconedStatusPreset } from "@app/components/IconedStatus";
import { useFetchAssessmentById } from "@app/queries/assessments";

export interface ApplicationAssessmentStatusProps {
  assessments?: Ref[];
  isLoading: boolean;
  fetchError?: AxiosError;
}

const getStatusIconFrom = (assessment: Assessment): IconedStatusPreset => {
  switch (assessment.status) {
    case "empty":
      return "NotStarted";
    case "started":
      return "InProgress";
    case "complete":
      return "Completed";
    default:
      return "NotStarted";
  }
};

export const ApplicationAssessmentStatus: React.FC<
  ApplicationAssessmentStatusProps
> = ({ assessments, isLoading, fetchError }) => {
  const { t } = useTranslation();
  //TODO: remove this once we have a proper assessment status
  const { assessment } = useFetchAssessmentById(assessments?.[0]?.id || 0);

  if (fetchError) {
    return <EmptyTextMessage message={t("terms.notAvailable")} />;
  }
  if (isLoading) {
    return <Spinner size="md" />;
  }

  return assessment ? (
    <IconedStatus preset={getStatusIconFrom(assessment)} />
  ) : (
    <IconedStatus preset="NotStarted" />
  );
};
