// hooks/useAssessmentStatus.js
import { Assessment, Archetype, Application } from "@app/api/models";
import { useFetchArchetypes } from "@app/queries/archetypes";
import { useFetchAssessments } from "@app/queries/assessments";
import { useMemo } from "react";

export const useAssessmentStatus = (application: Application) => {
  const { assessments } = useFetchAssessments();
  const { archetypes } = useFetchArchetypes();

  const isDirectlyAssessed =
    (application.assessed && (application.assessments?.length ?? 0) > 0) ??
    false;

  return useMemo(() => {
    const applicationAssessments =
      assessments?.filter(
        (assessment: Assessment) =>
          assessment.application?.id === application.id
      ) ?? [];
    const inheritedArchetypes =
      archetypes?.filter(
        (archetype: Archetype) =>
          archetype.applications?.map((app) => app.id).includes(application.id)
      ) ?? [];

    const assessmentsWithArchetypes = inheritedArchetypes.map(
      (inheritedArchetype) => ({
        inheritedArchetype,
        assessments: assessments.filter(
          (assessment) => assessment.archetype?.id === inheritedArchetype.id
        ),
      })
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

    const assessmentsFromArchetypesCount = assessmentsWithArchetypes.filter(
      ({ assessments }) => assessments.some((assessment) => assessment.required)
    ).length;

    const assessedArchetypesCount = assessmentsWithArchetypes.filter(
      ({ assessments, inheritedArchetype }) =>
        assessments.some(
          (assessment) =>
            assessment.required &&
            assessment.status === "complete" &&
            inheritedArchetype.assessed
        )
    ).length;

    const hasApplicationAssessmentInProgress = applicationAssessments?.some(
      (assessment: Assessment) =>
        assessment.required &&
        (assessment.status === "started" ||
          assessment.status === "empty" ||
          (assessment.status === "complete" &&
            application.assessments?.length !== 0))
    );

    return {
      allArchetypesAssessed,
      countOfFullyAssessedArchetypes: assessedArchetypesCount,
      countOfArchetypesWithRequiredAssessments: assessmentsFromArchetypesCount,
      hasApplicationAssessmentInProgress,
      isApplicationDirectlyAssessed: isDirectlyAssessed,
    };
  }, [
    assessments,
    archetypes,
    application.id,
    application.assessments,
    isDirectlyAssessed,
  ]);
};
