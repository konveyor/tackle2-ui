import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Flex, FlexItem } from "@patternfly/react-core";
import { RBAC, RBAC_TYPE, writeScopes } from "@app/rbac";
import { ConditionalTooltip } from "../ConditionalTooltip";

export interface AppTableActionButtonsProps {
  isDeleteEnabled?: boolean;
  tooltipMessage?: string;
  onEdit: () => void;
  onDelete: () => void;
}

export const AppTableActionButtons: React.FC<AppTableActionButtonsProps> = ({
  isDeleteEnabled = false,
  tooltipMessage = "",
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();

  return (
    <RBAC allowedPermissions={writeScopes} rbacType={RBAC_TYPE.Scope}>
      <Flex>
        <FlexItem align={{ default: "alignRight" }}>
          <Button aria-label="edit" variant="secondary" onClick={onEdit}>
            {t("actions.edit")}
          </Button>
        </FlexItem>
        <FlexItem>
          <ConditionalTooltip
            isTooltipEnabled={isDeleteEnabled}
            content={tooltipMessage}
          >
            <Button
              aria-label="delete"
              variant="link"
              onClick={onDelete}
              isAriaDisabled={isDeleteEnabled}
            >
              {t("actions.delete")}
            </Button>
          </ConditionalTooltip>
        </FlexItem>
      </Flex>
    </RBAC>
  );
};
