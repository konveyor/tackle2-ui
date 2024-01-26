import React from "react";
import { Application } from "@app/api/models";
import { Label, LabelGroup, Spinner } from "@patternfly/react-core";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { useTranslation } from "react-i18next";
import { useFetchArchetypes } from "@app/queries/archetypes";
import { useFetchAllAssessmentsWithArchetypes } from "@app/queries/assessments";

interface IAssessedArchetypesProps {
  application: Application | null;
}

export const AssessedArchetypes: React.FC<IAssessedArchetypesProps> = ({
  application,
}) => {
  const { t } = useTranslation();
  const {
    archetypes: applicationArchetypes,
    isFetching: isFetchingArchetypes,
  } = useFetchArchetypes(application);

  const {
    assessmentsWithArchetypes,
    isLoading: isFetchingAllAssessmentsWithArchetypesLoading,
  } = useFetchAllAssessmentsWithArchetypes(applicationArchetypes);

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

  if (isFetchingArchetypes || isFetchingAllAssessmentsWithArchetypesLoading) {
    return <Spinner size="md" />;
  }
  return (
    <LabelGroup>
      {assessedArchetypesWithARequiredAssessment?.length ? (
        assessedArchetypesWithARequiredAssessment?.map((archetype) => (
          <Label key={archetype?.id}>{archetype?.name}</Label>
        ))
      ) : (
        <EmptyTextMessage message={t("terms.none")} />
      )}
    </LabelGroup>
  );
};
