import React from "react";
import { useTranslation } from "react-i18next";
import { Icon, Tooltip } from "@patternfly/react-core";
import StarIcon from "@patternfly/react-icons/dist/esm/icons/star-icon";

import { Identity } from "@app/api/models";
import { useIdentityKind } from "@app/hooks/useIdentityKind";

export interface DefaultLabelProps {
  identity: Identity;
}

export const DefaultLabel: React.FC<{ identity: Identity }> = ({
  identity,
}) => {
  const { t } = useTranslation();
  const { kindLabels } = useIdentityKind();
  const isDefault = identity.default;

  if (!isDefault) {
    return <Icon aria-label="not default" />;
  }

  const typeName = kindLabels[identity.kind] ?? identity.kind;

  return (
    <Tooltip
      content={t("tooltip.defaultIdentity", {
        name: identity.name,
        type: typeName,
      })}
    >
      <Icon aria-label="default">
        <StarIcon />
      </Icon>
    </Tooltip>
  );
};
