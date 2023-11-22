import React from "react";
import { Application, Archetype } from "@app/api/models";
import { useFetchQuestionnaires } from "@app/queries/questionnaires";
import QuestionnairesTable from "./questionnaires-table";
import { useFetchAssessmentsByItemId } from "@app/queries/assessments";

export interface AssessmentActionsTableProps {
  application?: Application;
  archetype?: Archetype;
}

const AssessmentActionsTable: React.FC<AssessmentActionsTableProps> = ({
  application,
  archetype,
}) => {
  const { questionnaires, isFetching: isFetchingQuestionnaires } =
    useFetchQuestionnaires();
  const { assessments, isFetching: isFetchingAssessmentsById } =
    useFetchAssessmentsByItemId(!!archetype, archetype?.id || application?.id);

  const requiredQuestionnaires = questionnaires.filter(
    (questionnaire) => questionnaire.required
  );
  const archivedQuestionnaires = questionnaires.filter(
    (questionnaire) => !questionnaire.required
  );

  const nonRequiredQuestionnaireIds = questionnaires
    .filter((q) => !q.required)
    .map((q) => q.id);

  const relevantAssessmentIds = (
    application?.assessments ||
    archetype?.assessments ||
    []
  ).map((a) => a.id);

  const filteredArchivedAssessments = assessments.filter(
    (assessment) =>
      nonRequiredQuestionnaireIds.includes(assessment.questionnaire.id) &&
      relevantAssessmentIds.includes(assessment.id)
  );

  return (
    <>
      <QuestionnairesTable
        application={application}
        archetype={archetype}
        questionnaires={requiredQuestionnaires}
        assessments={assessments}
        isFetching={isFetchingQuestionnaires || isFetchingAssessmentsById}
        tableName="Required questionnaires"
      />
      {filteredArchivedAssessments.length === 0 ? null : (
        <QuestionnairesTable
          application={application}
          archetype={archetype}
          isReadonly
          questionnaires={archivedQuestionnaires}
          assessments={filteredArchivedAssessments}
          isFetching={isFetchingQuestionnaires || isFetchingAssessmentsById}
          tableName="Archived questionnaires"
        />
      )}
    </>
  );
};

export default AssessmentActionsTable;
