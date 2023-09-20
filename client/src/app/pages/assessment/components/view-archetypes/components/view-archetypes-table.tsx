import React from "react";
import { Ref } from "@app/api/models";
import { useFetchQuestionnaires } from "@app/queries/questionnaires";
import { useFetchAssessmentsByItemId } from "@app/queries/assessments";
import { useFetchArchetypeById } from "@app/queries/archetypes";
import QuestionnairesTable from "../../assessment-actions/components/questionnaires-table";

export interface ViewArchetypesTableProps {
  archetypeRef?: Ref | null;
}

const ViewArchetypesTable: React.FC<ViewArchetypesTableProps> = ({
  archetypeRef,
}) => {
  const { questionnaires, isFetching: isFetchingQuestionnaires } =
    useFetchQuestionnaires();
  const { archetype } = useFetchArchetypeById(archetypeRef?.id);
  const { assessments, isFetching: isFetchingAssessmentsById } =
    useFetchAssessmentsByItemId(true, archetypeRef?.id);

  const requiredQuestionnaires = questionnaires.filter(
    (questionnaire) => questionnaire.required
  );
  const archivedQuestionnaires = questionnaires.filter(
    (questionnaire) => !questionnaire.required
  );
  return (
    <>
      <QuestionnairesTable
        isReadonly
        archetype={archetype}
        questionnaires={requiredQuestionnaires}
        assessments={assessments}
        isFetching={isFetchingQuestionnaires || isFetchingAssessmentsById}
        tableName="Required questionnaires"
      />

      <QuestionnairesTable
        isReadonly
        archetype={archetype}
        questionnaires={archivedQuestionnaires}
        assessments={assessments}
        isFetching={isFetchingQuestionnaires || isFetchingAssessmentsById}
        tableName="Archived questionnaires"
      />
    </>
  );
};

export default ViewArchetypesTable;
