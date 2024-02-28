import React from "react";
import { useParams } from "react-router-dom";
import QuestionnaireSummary, {
  SummaryType,
} from "@app/components/questionnaire-summary/questionnaire-summary";
import { useFetchAssessmentById } from "@app/queries/assessments";

interface AssessmentSummaryRouteParams {
  assessmentId: string;
  applicationId: string;
}

const AssessmentSummaryPage: React.FC = () => {
  const { assessmentId } = useParams<AssessmentSummaryRouteParams>();
  const {
    assessment,
    isFetching: isFetchingAssessment,
    fetchError: fetchAssessmentError,
  } = useFetchAssessmentById(assessmentId);

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
