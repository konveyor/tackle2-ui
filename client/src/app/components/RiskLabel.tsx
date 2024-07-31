import React from "react";
import { useTranslation } from "react-i18next";

import { Label } from "@patternfly/react-core";

import { RISK_LIST } from "@app/Constants";
import { Risk } from "@app/api/models";
import { normalizeRisk } from "@app/utils/type-utils";

export interface IRiskLabelProps {
  risk?: Risk | string;
}

export const RiskLabel: React.FC<IRiskLabelProps> = ({
  risk,
}: IRiskLabelProps) => {
  const { t } = useTranslation();

  const asRisk = normalizeRisk(risk);
  const data = !asRisk ? undefined : RISK_LIST[asRisk];

  return (
    <Label color={data ? data.labelColor : "grey"}>
      {data ? t(data.i18Key) : risk}
    </Label>
  );
};
