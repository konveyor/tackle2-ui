import React from "react";
import { useTranslation } from "react-i18next";
import { Spinner } from "@patternfly/react-core";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { Application } from "@app/api/models";
import { IconedStatus, IconedStatusPreset } from "@app/components/IconedStatus";
import { useFetchAssessmentsByItemId } from "@app/queries/assessments";
import { useFetchArchetypes } from "@app/queries/archetypes";
interface ApplicationAssessmentStatusProps {
  application: Application;
  isLoading?: boolean;
}

export const ApplicationAssessmentStatus: React.FC<
  ApplicationAssessmentStatusProps
> = ({ application }) => {
  const { t } = useTranslation();

  const { archetypes, isFetching } = useFetchArchetypes();

  const applicationArchetypes = application.archetypes?.map((archetypeRef) => {
    return archetypes?.find((archetype) => archetype.id === archetypeRef.id);
  });

  const hasAssessedArchetype = applicationArchetypes?.some(
    (archetype) => !!archetype?.assessments?.length ?? 0 > 0
  );

  const {
    assessments,
    isFetching: isFetchingAssessmentsById,
    fetchError,
  } = useFetchAssessmentsByItemId(false, application.id);

  if (fetchError) {
    return <EmptyTextMessage message={t("terms.notAvailable")} />;
  }

  if (isFetching || isFetchingAssessmentsById) {
    return <Spinner size="md" />;
  }

  let statusPreset: IconedStatusPreset = "NotStarted"; // Default status
  let tooltipCount: number = 0;
  const isDirectlyAssessed =
    application.assessed && (application.assessments?.length ?? 0) > 0;
  if (isDirectlyAssessed) {
    statusPreset = "Completed";
  } else if (hasAssessedArchetype) {
    statusPreset = "InheritedAssessments";
    const assessedArchetypeCount =
      applicationArchetypes?.filter(
        (archetype) => archetype?.assessments?.length ?? 0 > 0
      ).length || 0;
    tooltipCount = assessedArchetypeCount;
  } else if (
    assessments?.some(
      (assessment) =>
        assessment.status === "started" || assessment.status === "complete"
    )
  ) {
    statusPreset = "InProgress";
  }
  return <IconedStatus preset={statusPreset} tooltipCount={tooltipCount} />;
};
