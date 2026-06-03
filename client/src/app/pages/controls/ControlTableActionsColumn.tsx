import * as React from "react";
import { useTranslation } from "react-i18next";
import { PencilAltIcon } from "@patternfly/react-icons";
import { Td } from "@patternfly/react-table";

import { OverflowActionMenu } from "@app/components/overflow-action-menu";
import { ScopeGate, controlsWriteScopes } from "@app/scopes";

export interface ControlTableActionsColumnProps {
  isDeleteEnabled: boolean;
  deleteTooltipMessage?: string;
  onEdit: () => void;
  onDelete: () => void;
}

export const ControlTableActionsColumn: React.FC<
  ControlTableActionsColumnProps
> = ({ isDeleteEnabled, deleteTooltipMessage = "", onEdit, onDelete }) => {
  const { t } = useTranslation();
  return (
    <ScopeGate requiredScopes={controlsWriteScopes}>
      <Td isActionCell>
        <OverflowActionMenu
          breakpoint="lg"
          toggleId="row-actions"
          toggleAriaLabel={t("actions.rowActions")}
          items={[
            {
              title: t("actions.edit"),
              onClick: onEdit,
              itemKey: "edit",
              variant: "plain",
              icon: <PencilAltIcon />,
              ouiaId: "pencil-action",
              useOnlyIconWhenShared: true,
              isShared: true,
              "aria-label": t("actions.edit"),
              tooltipProps: {
                content: t("actions.edit"),
              },
            },
            {
              title: t("actions.delete"),
              onClick: onDelete,
              itemKey: "delete",
              isDanger: true,
              isAriaDisabled: !isDeleteEnabled,
              tooltipProps: deleteTooltipMessage
                ? {
                    content: deleteTooltipMessage,
                  }
                : undefined,
            },
          ]}
        />
      </Td>
    </ScopeGate>
  );
};
