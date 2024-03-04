import React from "react";
import { useTranslation } from "react-i18next";
import { Application, Archetype, Assessment } from "@app/api/models";
import { IconedStatus, IconedStatusPreset } from "@app/components/IconedStatus";
import { Spinner } from "@patternfly/react-core";
interface ApplicationAssessmentStatusProps {
  application: Application;
  assessments: Assessment[];
  archetypes: Archetype[];
  isLoading?: boolean;
}

export const ApplicationAssessmentStatus: React.FC<
  ApplicationAssessmentStatusProps
> = ({ application, assessments, archetypes, isLoading }) => {
  const { t } = useTranslation();

  const applicationAssessments = assessments?.filter(
    (assessment: Assessment) => assessment.application?.id === application.id
  );
  const inheritedArchetypes = archetypes?.filter(
    (archetype: Archetype) =>
      archetype.applications?.map((app) => app.id).includes(application.id)
  );
  const assessmentStatusInfo = React.useMemo(() => {
    const assessmentsWithArchetypes = inheritedArchetypes.map(
      (inheritedArchetype) => ({
        inheritedArchetype,
        assessments: assessments.filter(
          (assessment) => assessment.archetype?.id === inheritedArchetype.id
        ),
      })
    );

    const someArchetypesAssessed = assessmentsWithArchetypes.some(
      ({ assessments }) => assessments.length > 0
    );

    const allArchetypesAssessed =
      assessmentsWithArchetypes.length > 0 &&
      assessmentsWithArchetypes.every(({ inheritedArchetype, assessments }) => {
        const requiredAssessments = assessments.filter(
          (assessment) => assessment.required
        );
        return (
          inheritedArchetype.assessed &&
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
      assessmentsWithArchetypes.filter(({ assessments, inheritedArchetype }) =>
        assessments.some(
          (assessment) =>
            assessment.required &&
            assessment.status === "complete" &&
            inheritedArchetype.assessed
        )
      );
    const assessedArchetypeCount =
      inheritedArchetypes?.filter(
        (inheritedArchetype) =>
          inheritedArchetype?.assessments?.length ??
          (0 > 0 && inheritedArchetype.assessed)
      ).length || 0;

    return {
      assessmentsWithArchetypes,
      someArchetypesAssessed,
      allArchetypesAssessed,
      hasInProgressOrNotStartedRequiredAssessments,
      assessedArchetypesWithARequiredAssessment,
      assessedArchetypeCount,
    };
  }, [inheritedArchetypes, assessments]);

  if (isLoading) {
    return <Spinner size="sm" />;
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
    applicationAssessments?.some(
      (assessment) => assessment.status === "started"
    )
  ) {
    statusPreset = "InProgress";
  }
  return <IconedStatus preset={statusPreset} tooltipCount={tooltipCount} />;
};
