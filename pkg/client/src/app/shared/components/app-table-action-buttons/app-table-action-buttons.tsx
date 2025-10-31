import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Flex, FlexItem } from "@patternfly/react-core";
import { RBAC, RBAC_TYPE, writeScopes } from "@app/rbac";

export interface AppTableActionButtonsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export const AppTableActionButtons: React.FC<AppTableActionButtonsProps> = ({
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
          <Button aria-label="delete" variant="link" onClick={onDelete}>
            {t("actions.delete")}
          </Button>
        </FlexItem>
      </Flex>
    </RBAC>
  );
};
