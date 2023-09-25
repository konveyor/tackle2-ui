import React from "react";

import { RiskLabel } from "@app/components/RiskLabel";
import { Application } from "@app/api/models";
import { useFetchAssessmentsByItemId } from "@app/queries/assessments";
import { Alert, Spinner } from "@patternfly/react-core";

export interface IApplicationRiskProps {
  application: Application;
}

export const ApplicationRisk: React.FC<IApplicationRiskProps> = ({
  application,
}) => {
  const {
    assessments,
    isFetching: isFetchingAssessmentsById,
    fetchError,
  } = useFetchAssessmentsByItemId(false, application.id);

  if (isFetchingAssessmentsById || fetchError) {
    return (
      <>
        {isFetchingAssessmentsById && <Spinner />}{" "}
        {fetchError && <Alert variant="warning" isInline title="Error" />}
      </>
    );
  }

  if (!assessments || assessments.length === 0) {
    return (
      <>
        <RiskLabel risk={"unknown"} />
        {isFetchingAssessmentsById && <Spinner />}
      </>
    );
  }

  return <RiskLabel risk={assessments[0].risk || "unknown"} />;
};
