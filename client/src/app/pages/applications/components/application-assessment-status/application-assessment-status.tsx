import React from "react";
import { Application } from "@app/api/models";
import { IconedStatus, IconedStatusPreset } from "@app/components/IconedStatus";
import { Spinner } from "@patternfly/react-core";
import { useAssessmentStatus } from "@app/hooks/useAssessmentStatus";
interface ApplicationAssessmentStatusProps {
  application: Application;
  isLoading?: boolean;
}

export const ApplicationAssessmentStatus: React.FC<
  ApplicationAssessmentStatusProps
> = ({ application, isLoading }) => {
  const assessmentStatusInfo = useAssessmentStatus(application);

  if (isLoading) {
    return <Spinner size="sm" />;
  }

  let statusPreset: IconedStatusPreset = "NotStarted"; // Default status
  let tooltipCount: number = 0;

  const {
    allArchetypesAssessed,
    countOfFullyAssessedArchetypes,
    countOfArchetypesWithRequiredAssessments,
    hasApplicationAssessmentInProgress,
    isApplicationDirectlyAssessed,
  } = assessmentStatusInfo;

  if (isApplicationDirectlyAssessed) {
    statusPreset = "Completed";
  } else if (allArchetypesAssessed) {
    statusPreset = "InheritedAssessments";
    tooltipCount = countOfFullyAssessedArchetypes;
  } else if (countOfArchetypesWithRequiredAssessments > 0) {
    statusPreset = "InProgressInheritedAssessments";
    tooltipCount = countOfArchetypesWithRequiredAssessments;
  } else if (hasApplicationAssessmentInProgress) {
    statusPreset = "InProgress";
  }
  return <IconedStatus preset={statusPreset} tooltipCount={tooltipCount} />;
};
