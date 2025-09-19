import React from "react";
import { useParams } from "react-router-dom";

import "./questionnaire-page.css";
import QuestionnaireSummary, {
  SummaryType,
} from "@app/components/questionnaire-summary/questionnaire-summary";
import { useFetchQuestionnaireById } from "@app/queries/questionnaires";

interface QuestionnairePageParams {
  questionnaireId: string;
}

const QuestionnairePage: React.FC = () => {
  const { questionnaireId } = useParams<QuestionnairePageParams>();

  const {
    questionnaire,
    isFetching: isFetchingQuestionnaireById,
    fetchError: fetchQuestionnaireByIdError,
  } = useFetchQuestionnaireById(questionnaireId);

  return (
    <QuestionnaireSummary
      summaryData={questionnaire}
      isFetching={isFetchingQuestionnaireById}
      fetchError={fetchQuestionnaireByIdError}
      summaryType={SummaryType.Questionnaire}
    />
  );
};

export default QuestionnairePage;
