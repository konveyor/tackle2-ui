import React from "react";
import { Application, AssessmentWithSectionOrder } from "@app/api/models";
import { Label, LabelGroup, Spinner } from "@patternfly/react-core";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { useTranslation } from "react-i18next";
import { useFetchArchetypes } from "@app/queries/archetypes";
import { useFetchAssessments } from "@app/queries/assessments";

interface IAssessedArchetypesProps {
  application: Application | null;
}

export const AssessedArchetypes: React.FC<IAssessedArchetypesProps> = ({
  application,
}) => {
  const { t } = useTranslation();
  const { archetypes, isFetching: isFetchingArchetypes } =
    useFetchArchetypes(application);
  const { assessments, isFetching: isFetchingAssessments } =
    useFetchAssessments();

  const assessedArchetypes = React.useMemo(() => {
    if (!archetypes || !assessments) return [];

    return archetypes.filter((archetype) =>
      assessments.some(
        (assessment: AssessmentWithSectionOrder) =>
          assessment.archetype?.id === archetype.id &&
          assessment.required &&
          archetype.assessed
      )
    );
  }, [archetypes, assessments]);

  if (isFetchingArchetypes || isFetchingAssessments) {
    return <Spinner size="md" />;
  }

  return (
    <LabelGroup>
      {assessedArchetypes.length ? (
        assessedArchetypes.map((archetype) => (
          <Label key={archetype.id}>{archetype.name}</Label>
        ))
      ) : (
        <EmptyTextMessage message={t("terms.none")} />
      )}
    </LabelGroup>
  );
};
