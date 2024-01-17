import React from "react";
import { Ref } from "@app/api/models";
import { Label, LabelGroup, Spinner } from "@patternfly/react-core";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { useTranslation } from "react-i18next";
import { useFetchArchetypes } from "@app/queries/archetypes";
import { useFetchAllAssessmentsWithArchetypes } from "@app/queries/assessments";

interface IAssessedArchetypesProps {
  archetypeRefs: Ref[] | undefined;
}

export const AssessedArchetypes: React.FC<IAssessedArchetypesProps> = ({
  archetypeRefs,
}) => {
  const { t } = useTranslation();
  const { archetypes, isFetching: isFetchingArchetypes } = useFetchArchetypes();
  const applicationArchetypes = archetypes.filter(
    (archetype) => archetypeRefs?.some((ref) => ref.id === archetype.id)
  );

  const {
    assessmentsWithArchetypes,
    isLoading: isFetchingAllAssessmentsWithArchetypesLoading,
  } = useFetchAllAssessmentsWithArchetypes(applicationArchetypes || []);
  const filteredArchetypes = assessmentsWithArchetypes
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
      {filteredArchetypes?.length ? (
        filteredArchetypes?.map((archetype) => (
          <Label key={archetype?.id}>{archetype?.name}</Label>
        ))
      ) : (
        <EmptyTextMessage message={t("terms.none")} />
      )}
    </LabelGroup>
  );
};
