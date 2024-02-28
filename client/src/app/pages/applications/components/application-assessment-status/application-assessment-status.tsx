import React from "react";
import { useTranslation } from "react-i18next";
import { Spinner } from "@patternfly/react-core";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { Application, Assessment } from "@app/api/models";
import { IconedStatus, IconedStatusPreset } from "@app/components/IconedStatus";
import { useFetchAssessments } from "@app/queries/assessments";
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
  const { assessments, fetchError } = useFetchAssessments();

  const filteredAssessments = assessments?.filter(
    (assessment: Assessment) => assessment.application?.id === application.id
  );

  const applicationArchetypes = application.archetypes?.map((archetypeRef) => {
    return archetypes?.find((archetype) => archetype.id === archetypeRef.id);
  });

  const someArchetypesAssessed = applicationArchetypes?.some(
    (archetype) => !!archetype?.assessments?.length ?? 0 > 0
  );
  const areAllArchetypesAssessed =
    applicationArchetypes?.every(
      (archetype) => archetype?.assessments?.length ?? 0 > 0
    ) ?? false;

  if (fetchError) {
    return <EmptyTextMessage message={t("terms.notAvailable")} />;
  }

  if (isFetching || isFetching) {
    return <Spinner size="md" />;
  }

  let statusPreset: IconedStatusPreset = "NotStarted"; // Default status
  let tooltipCount: number = 0;

  const assessedArchetypeCount =
    applicationArchetypes?.filter(
      (archetype) => archetype?.assessments?.length ?? 0 > 0
    ).length || 0;

  const isDirectlyAssessed =
    application.assessed && (application.assessments?.length ?? 0) > 0;

  if (isDirectlyAssessed) {
    statusPreset = "Completed";
  } else if (areAllArchetypesAssessed) {
    statusPreset = "InheritedAssessments";
    tooltipCount = assessedArchetypeCount;
  } else if (someArchetypesAssessed) {
    statusPreset = "InProgressInheritedAssessments";
    tooltipCount = assessedArchetypeCount;
  } else if (
    filteredAssessments?.some(
      (assessment) =>
        assessment.status === "started" || assessment.status === "complete"
    )
  ) {
    statusPreset = "InProgress";
  }
  return <IconedStatus preset={statusPreset} tooltipCount={tooltipCount} />;
};
