import React from "react";
import { useTranslation } from "react-i18next";
import { Label } from "@patternfly/react-core";

import { PROPOSED_ACTION_LIST } from "@app/Constants";
import { ProposedAction } from "@app/api/models";

export interface IProposedActionLabelProps {
  action: ProposedAction;
}

export const ProposedActionLabel: React.FunctionComponent<
  IProposedActionLabelProps
> = ({ action }: IProposedActionLabelProps) => {
  const { t } = useTranslation();

  const data = PROPOSED_ACTION_LIST[action];

  return (
    <Label color={data ? data.labelColor : "grey"}>
      {data ? t(data.i18Key) : action}
    </Label>
  );
};
