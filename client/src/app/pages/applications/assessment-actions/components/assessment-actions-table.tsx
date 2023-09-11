import React from "react";
import { Application } from "@app/api/models";
import { useFetchQuestionnaires } from "@app/queries/questionnaires";
import { useFetchAssessmentsByAppId } from "@app/queries/assessments";
import QuestionnairesTable from "./questionnaires-table";

export interface AssessmentActionsTableProps {
  application: Application;
}

const AssessmentActionsTable: React.FC<AssessmentActionsTableProps> = ({
  application,
}) => {
  const { questionnaires, isFetching: isFetchingQuestionnaires } =
    useFetchQuestionnaires();
  const { assessments, isFetching: isFetchingAssessmentsById } =
    useFetchAssessmentsByAppId(application.id);

  const requiredQuestionnaires = questionnaires.filter(
    (questionnaire) => questionnaire.required
  );
  const archivedQuestionnaires = questionnaires.filter(
    (questionnaire) => !questionnaire.required
  );

  return (
    <>
      <QuestionnairesTable
        application={application}
        questionnaires={requiredQuestionnaires}
        assessments={assessments}
        isFetching={isFetchingQuestionnaires || isFetchingAssessmentsById}
        tableName="Required questionnaires"
      />

      <QuestionnairesTable
        application={application}
        questionnaires={archivedQuestionnaires}
        assessments={assessments}
        isFetching={isFetchingQuestionnaires || isFetchingAssessmentsById}
        tableName="Archived questionnaires"
      />
    </>
  );
};

export default AssessmentActionsTable;
