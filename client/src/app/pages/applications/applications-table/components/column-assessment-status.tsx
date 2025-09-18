import React from "react";
import { Spinner } from "@patternfly/react-core";

import { IconedStatus, IconedStatusPreset } from "@app/components/Icons";

import { DecoratedApplication } from "../../useDecoratedApplications";

interface ColumnAssessmentStatusProps {
  application: DecoratedApplication;
  isLoading?: boolean;
}

export const ColumnAssessmentStatus: React.FC<ColumnAssessmentStatusProps> = ({
  application,
  isLoading = false,
}) => {
  if (isLoading) {
    return <Spinner size="sm" />;
  }

  let statusPreset: IconedStatusPreset = "NotStarted"; // Default status
  let tooltipCount: number = 0;

  const { directStatus, inheritedStatus, inherited } =
    application.assessmentStatus;

  if (directStatus === "complete") {
    statusPreset = "Completed";
  } else if (directStatus === "partial") {
    statusPreset = "InProgress";
  } else if (inheritedStatus === "complete") {
    statusPreset = "InheritedAssessments";
    tooltipCount = inherited?.length ?? 0;
  } else if (inheritedStatus === "partial") {
    statusPreset = "InProgressInheritedAssessments";
    tooltipCount = inherited?.length ?? 0;
  }

  return <IconedStatus preset={statusPreset} tooltipCount={tooltipCount} />;
};
