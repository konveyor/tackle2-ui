import React, { useEffect } from "react";
import { RiskLabel } from "@app/shared/components";
import { Application, Assessment } from "@app/api/models";
import { useFetchRisks } from "@app/queries/risks";

export interface IApplicationRiskProps {
  application: Application;
  assessment?: Assessment;
}

export const ApplicationRisk: React.FC<IApplicationRiskProps> = ({
  application,
  assessment,
}) => {
  const { risks: assessmentRisks, refetch: fetchRisk } = useFetchRisks([
    application.id!,
  ]);

  useEffect(() => {
    fetchRisk();
  }, [fetchRisk, application, assessment]);

  return (
    <RiskLabel
      risk={assessmentRisks?.length ? assessmentRisks[0].risk : "UNKNOWN"}
    />
  );
};
