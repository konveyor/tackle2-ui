import React from "react";

import { Ref } from "@app/api/models";
import { useFetchArchetypeById } from "@app/queries/archetypes";
import { useFetchAssessmentsByItemId } from "@app/queries/assessments";
import { useFetchQuestionnaires } from "@app/queries/questionnaires";

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

  const nonRequiredQuestionnaireIds = questionnaires
    .filter((q) => !q.required)
    .map((q) => q.id);

  const relevantAssessmentIds = (archetype?.assessments || []).map((a) => a.id);

  const filteredArchivedAssessments = assessments.filter(
    (assessment) =>
      nonRequiredQuestionnaireIds.includes(assessment.questionnaire.id) &&
      relevantAssessmentIds.includes(assessment.id)
  );
  const filteredArchivedQuestionnaires = archivedQuestionnaires.filter(
    (questionnaire) =>
      filteredArchivedAssessments.some(
        (assessment) => assessment.questionnaire.id === questionnaire.id
      )
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
      {filteredArchivedAssessments.length === 0 ? null : (
        <QuestionnairesTable
          archetype={archetype}
          isReadonly
          questionnaires={filteredArchivedQuestionnaires}
          assessments={filteredArchivedAssessments}
          isFetching={isFetchingQuestionnaires || isFetchingAssessmentsById}
          tableName="Archived questionnaires"
        />
      )}
    </>
  );
};

export default ViewArchetypesTable;
