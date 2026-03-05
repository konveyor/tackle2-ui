import * as React from "react";
import { useParams } from "react-router-dom";

import QuestionnaireSummary, {
  SummaryType,
} from "@app/components/questionnaire-summary/questionnaire-summary";
import { useFetchAssessmentById } from "@app/queries/assessments";

const AssessmentSummaryPage: React.FC = () => {
  const { assessmentId } = useParams<"assessmentId">();
  const {
    assessment,
    isFetching: isFetchingAssessment,
    fetchError: fetchAssessmentError,
  } = useFetchAssessmentById(assessmentId!);

  return (
    <QuestionnaireSummary
      summaryData={assessment}
      isFetching={isFetchingAssessment}
      fetchError={fetchAssessmentError}
      summaryType={SummaryType.Assessment}
    />
  );
};

export default AssessmentSummaryPage;
