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
  console.log("archetype in actions table", archetype);
  console.log("application in actions table", application);
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
  console.log("application", application);
  console.log("assessments", assessments);
  console.log("questionnaires", questionnaires);
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

      <QuestionnairesTable
        application={application}
        archetype={archetype}
        questionnaires={archivedQuestionnaires}
        assessments={assessments}
        isFetching={isFetchingQuestionnaires || isFetchingAssessmentsById}
        tableName="Archived questionnaires"
      />
    </>
  );
};

export default AssessmentActionsTable;
