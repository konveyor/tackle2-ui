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

  const { archetypes, isFetching } = useFetchArchetypes(application);
  const { assessments, fetchError } = useFetchAssessments();

  const filteredAssessments = assessments?.filter(
    (assessment: Assessment) => assessment.application?.id === application.id
  );
  const assessmentStatusInfo = React.useMemo(() => {
    const assessmentsWithArchetypes = archetypes.map((archetype) => ({
      archetype,
      assessments: assessments.filter(
        (assessment) => assessment.archetype?.id === archetype.id
      ),
    }));

    const someArchetypesAssessed = assessmentsWithArchetypes.some(
      ({ assessments }) => assessments.length > 0
    );

    const allArchetypesAssessed =
      assessmentsWithArchetypes.length > 0 &&
      assessmentsWithArchetypes.every(({ archetype, assessments }) => {
        const requiredAssessments = assessments.filter(
          (assessment) => assessment.required
        );
        return (
          archetype.assessed &&
          assessments.length > 0 &&
          requiredAssessments.length > 0 &&
          requiredAssessments.every(
            (assessment) => assessment.status === "complete"
          )
        );
      });

    const hasInProgressOrNotStartedRequiredAssessments =
      assessmentsWithArchetypes.some(({ assessments }) =>
        assessments.some(
          (assessment) =>
            assessment.required &&
            ["empty", "started"].includes(assessment.status)
        )
      );

    const assessedArchetypesWithARequiredAssessment =
      assessmentsWithArchetypes.filter(({ assessments, archetype }) =>
        assessments.some(
          (assessment) =>
            assessment.required &&
            assessment.status === "complete" &&
            archetype.assessed
        )
      );
    const assessedArchetypeCount =
      archetypes?.filter(
        (archetype) =>
          archetype?.assessments?.length ?? (0 > 0 && archetype.assessed)
      ).length || 0;

    return {
      assessmentsWithArchetypes,
      someArchetypesAssessed,
      allArchetypesAssessed,
      hasInProgressOrNotStartedRequiredAssessments,
      assessedArchetypesWithARequiredAssessment,
      assessedArchetypeCount,
    };
  }, [archetypes, assessments]);

  if (fetchError) {
    return <EmptyTextMessage message={t("terms.notAvailable")} />;
  }

  if (isFetching || isFetching) {
    return <Spinner size="md" />;
  }

  let statusPreset: IconedStatusPreset = "NotStarted"; // Default status
  let tooltipCount: number = 0;

  const isDirectlyAssessed =
    application.assessed && (application.assessments?.length ?? 0) > 0;
  const {
    allArchetypesAssessed,
    assessedArchetypesWithARequiredAssessment,
    hasInProgressOrNotStartedRequiredAssessments,
  } = assessmentStatusInfo;

  if (isDirectlyAssessed) {
    statusPreset = "Completed";
  } else if (allArchetypesAssessed) {
    statusPreset = "InheritedAssessments";
    tooltipCount = assessedArchetypesWithARequiredAssessment.length;
  } else if (hasInProgressOrNotStartedRequiredAssessments) {
    statusPreset = "InProgressInheritedAssessments";
    tooltipCount = assessedArchetypesWithARequiredAssessment.length;
  } else if (
    filteredAssessments?.some((assessment) => assessment.status === "started")
  ) {
    statusPreset = "InProgress";
  }
  return <IconedStatus preset={statusPreset} tooltipCount={tooltipCount} />;
};
