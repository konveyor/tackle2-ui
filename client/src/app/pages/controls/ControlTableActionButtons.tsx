import React from "react";
import { useTranslation } from "react-i18next";
import { controlsWriteScopes, RBAC, RBAC_TYPE } from "@app/rbac";
import { ActionsColumn, Td } from "@patternfly/react-table";
import { Button, OverflowMenu, Tooltip } from "@patternfly/react-core";
import { PencilAltIcon } from "@patternfly/react-icons";

export interface ControlTableActionButtonsProps {
  isDeleteEnabled?: boolean;
  deleteTooltipMessage?: string;
  onEdit: () => void;
  onDelete: () => void;
}

export const ControlTableActionButtons: React.FC<
  ControlTableActionButtonsProps
> = ({
  isDeleteEnabled = false,
  deleteTooltipMessage = "",
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  return (
    <RBAC allowedPermissions={controlsWriteScopes} rbacType={RBAC_TYPE.Scope}>
      <Td isActionCell id="action">
        <OverflowMenu breakpoint="sm">
          <Tooltip content={t("actions.edit")}>
            <Button variant="plain" icon={<PencilAltIcon />} onClick={onEdit} />
          </Tooltip>
          <ActionsColumn
            items={[
              {
                isAriaDisabled: isDeleteEnabled,
                tooltipProps: {
                  content: isDeleteEnabled ? deleteTooltipMessage : "",
                },
                isDanger: isDeleteEnabled == false,
                title: t("actions.delete"),
                onClick: onDelete,
              },
            ]}
          />
        </OverflowMenu>
      </Td>
    </RBAC>
  );
};
