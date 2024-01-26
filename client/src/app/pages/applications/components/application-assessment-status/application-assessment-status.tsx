import React from "react";
import { useTranslation } from "react-i18next";
import { Spinner } from "@patternfly/react-core";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { Application } from "@app/api/models";
import { IconedStatus, IconedStatusPreset } from "@app/components/IconedStatus";
import {
  useFetchAllAssessmentsWithArchetypes,
  useFetchAssessmentsByItemId,
} from "@app/queries/assessments";
import { useFetchArchetypes } from "@app/queries/archetypes";
interface ApplicationAssessmentStatusProps {
  application: Application;
  isLoading?: boolean;
}

export const ApplicationAssessmentStatus: React.FC<
  ApplicationAssessmentStatusProps
> = ({ application }) => {
  const { t } = useTranslation();

  const { archetypes, isFetching } = useFetchArchetypes(application);
  console.log("app assessment status", archetypes, application.name);

  const {
    assessmentsWithArchetypes,
    isLoading: isFetchingAllAssessmentsWithArchetypesLoading,
  } = useFetchAllAssessmentsWithArchetypes(archetypes);

  const assessedArchetypesWithARequiredAssessment = assessmentsWithArchetypes
    ?.filter((assessmentsWithArchetype) => {
      return (
        assessmentsWithArchetype.archetype.assessed &&
        assessmentsWithArchetype.assessments.some(
          (assessment) => assessment?.required === true
        )
      );
    })
    .map((assessmentsWithArchetype) => assessmentsWithArchetype.archetype);

  const allArchetypesAssessed =
    assessmentsWithArchetypes.length > 0 &&
    assessmentsWithArchetypes?.every((assessmentsWithArchetype) => {
      const requiredAssessments = assessmentsWithArchetype.assessments.filter(
        (assessment) => assessment?.required === true
      );
      return (
        assessmentsWithArchetype.archetype.assessed &&
        assessmentsWithArchetype.assessments.length > 0 &&
        requiredAssessments.length > 0 &&
        requiredAssessments.every(
          (assessment) => assessment?.status === "complete"
        )
      );
    });

  const hasInProgressOrNotStartedRequiredAssessments = () => {
    return (
      assessmentsWithArchetypes?.some(
        (assessmentsWithArchetype) =>
          !assessmentsWithArchetype.archetype.assessed &&
          assessmentsWithArchetype.assessments.some(
            (assessment) =>
              assessment?.required === true &&
              (assessment.status === "empty" ||
                assessment.status === "started" ||
                assessment.status === "complete")
          )
      ) ?? false
    );
  };
  console.log(
    "has in progress",
    hasInProgressOrNotStartedRequiredAssessments(),
    { assessmentsWithArchetypes }
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

  console.log("app assessment data", {
    allArchetypesAssessed,
    assessmentsWithArchetypes,
    application,
    archetypes,
    assessments,
    assessedArchetypesWithARequiredAssessment,
  });

  if (isDirectlyAssessed) {
    statusPreset = "Completed";
  } else if (allArchetypesAssessed) {
    statusPreset = "InheritedAssessments";
    tooltipCount = assessedArchetypesWithARequiredAssessment?.length ?? 0;
  } else if (hasInProgressOrNotStartedRequiredAssessments()) {
    statusPreset = "InProgressInheritedAssessments";
    tooltipCount = assessedArchetypesWithARequiredAssessment?.length ?? 0;
  } else if (
    assessments?.some((assessment) => assessment.status === "started")
  ) {
    statusPreset = "InProgress";
  }
  return <IconedStatus preset={statusPreset} tooltipCount={tooltipCount} />;
};
