import React, { useEffect } from "react";

import { RiskLabel } from "@app/components/RiskLabel";
import { Application, Assessment } from "@app/api/models";

export interface IApplicationRiskProps {
  application: Application;
  assessment?: Assessment;
}

export const ApplicationRisk: React.FC<IApplicationRiskProps> = ({
  application,
  assessment,
}) => {
  //TODO calculate risk from assessment response
  return <RiskLabel risk={assessment?.risk || "UNKNOWN"} />;
};
