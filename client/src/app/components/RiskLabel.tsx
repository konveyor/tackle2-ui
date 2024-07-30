import React from "react";
import { useTranslation } from "react-i18next";

import { Label } from "@patternfly/react-core";

import { RISK_LIST } from "@app/Constants";
import { Risk } from "@app/api/models";

export interface IRiskLabelProps {
  risk?: Risk | string;
}

function normalizeToRisk(risk?: Risk | string): Risk | undefined {
  let normal: Risk | undefined = undefined;

  switch (risk) {
    case "green":
      normal = "green";
      break;

    case "yellow":
      normal = "yellow";
      break;

    case "red":
      normal = "red";
      break;

    case "unassessed":
      normal = "unassessed";
      break;

    case "unknown":
      normal = "unknown";
      break;
  }

  return normal;
}

export const RiskLabel: React.FC<IRiskLabelProps> = ({
  risk = "unknown",
}: IRiskLabelProps) => {
  const { t } = useTranslation();

  const asRisk = normalizeToRisk(risk);
  const data = !asRisk ? undefined : RISK_LIST[asRisk];

  return (
    <Label color={data ? data.labelColor : "grey"}>
      {data ? t(data.i18Key) : risk}
    </Label>
  );
};
