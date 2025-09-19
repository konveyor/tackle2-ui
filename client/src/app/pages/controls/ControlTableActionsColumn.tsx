import React from "react";
import { useTranslation } from "react-i18next";
import { Button, OverflowMenu, Tooltip } from "@patternfly/react-core";
import { PencilAltIcon } from "@patternfly/react-icons";
import { ActionsColumn, Td } from "@patternfly/react-table";

import { RBAC, RBAC_TYPE, controlsWriteScopes } from "@app/rbac";

export interface ControlTableActionsColumnProps {
  isDeleteEnabled?: boolean;
  deleteTooltipMessage?: string;
  onEdit: () => void;
  onDelete: () => void;
}

export const ControlTableActionsColumn: React.FC<
  ControlTableActionsColumnProps
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
