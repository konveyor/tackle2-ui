import React from "react";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";

import {
  EmptyTextMessage,
  IconedStatus,
  IconedStatusPreset,
} from "@app/shared/components";
import { Assessment } from "@app/api/models";
import { Spinner } from "@patternfly/react-core";

export interface ApplicationAssessmentStatusProps {
  assessment?: Assessment;
  isLoading: boolean;
  fetchError?: AxiosError;
}

const getStatusIconFrom = (assessment: Assessment): IconedStatusPreset => {
  switch (assessment.status) {
    case "EMPTY":
      return "NotStarted";
    case "STARTED":
      return "InProgress";
    case "COMPLETE":
      return "Completed";
    default:
      return "NotStarted";
  }
};

export const ApplicationAssessmentStatus: React.FC<
  ApplicationAssessmentStatusProps
> = ({ assessment, isLoading, fetchError }) => {
  const { t } = useTranslation();

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
