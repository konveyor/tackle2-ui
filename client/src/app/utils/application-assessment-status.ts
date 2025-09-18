import { Application, Archetype, Assessment } from "@app/api/models";

export interface ApplicationAssessmentStatus {
  isDirectlyAssessed: boolean;
  direct?: Assessment[];
  directStatus: AggregateAssessmentStatus;
  inherited?: {
    archetype: Archetype;
    assessments?: Assessment[];
    status: AggregateAssessmentStatus;
  }[];
  inheritedStatus: AggregateAssessmentStatus;
}

export type AggregateAssessmentStatus = "none" | "partial" | "complete";

const chooseAssessmentStatus = (
  containerAssessed?: boolean,
  assessments?: Assessment[]
): AggregateAssessmentStatus => {
  if (!assessments || assessments.length === 0) {
    return "none";
  }
  return containerAssessed ? "complete" : "partial";
};

export const buildApplicationAssessmentStatus = (
  application: Application,
  archetypes: Archetype[],
  assessments: Assessment[]
): ApplicationAssessmentStatus => {
  const isDirectlyAssessed =
    (application.assessed && (application.assessments?.length ?? 0) > 0) ??
    false;

  const direct = assessments.filter(
    (assessment) =>
      assessment.required && assessment.application?.id === application.id
  );

  const directStatus = chooseAssessmentStatus(application.assessed, direct);

  const inherited = archetypes
    .filter((archetype) =>
      archetype.applications?.some(({ id }) => id === application.id)
    )
    .map((archetype) => {
      const archetypeAssessments = assessments.filter(
        (assessment) =>
          assessment.required && assessment.archetype?.id === archetype.id
      );

      return {
        archetype,
        assessments: archetypeAssessments,
        status: chooseAssessmentStatus(
          archetype.assessed,
          archetypeAssessments
        ),
      };
    });

  const inheritedStatus: AggregateAssessmentStatus =
    !inherited ||
    inherited.length === 0 ||
    inherited.every(({ status }) => status === "none")
      ? "none"
      : inherited.every(({ status }) => status === "complete")
        ? "complete"
        : "partial";

  return {
    isDirectlyAssessed,
    direct,
    directStatus,
    inherited,
    inheritedStatus,
  };
};
