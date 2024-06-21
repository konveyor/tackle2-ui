import React from "react";
import { useTranslation } from "react-i18next";
import { controlsWriteScopes, RBAC, RBAC_TYPE } from "@app/rbac";
import { ActionsColumn, Td } from "@patternfly/react-table";
import { Button, Tooltip } from "@patternfly/react-core";
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
      <Td isActionCell id="pencil-action">
        <Tooltip content={t("actions.edit")}>
          <Button variant="plain" icon={<PencilAltIcon />} onClick={onEdit} />
        </Tooltip>
      </Td>
      <Td isActionCell id="row-actions">
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
      </Td>
    </RBAC>
  );
};
