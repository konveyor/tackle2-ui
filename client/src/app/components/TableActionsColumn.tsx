import React from "react";
import { OverflowMenu } from "@patternfly/react-core";
import { ActionsColumn, IAction, Td } from "@patternfly/react-table";

export interface TableActionsColumnProps {
  breakpoint?: "sm" | "md" | "lg" | "xl" | "2xl";
  primaryAction?: React.ReactNode;
  items?: IAction[];
}

export const TableActionsColumn: React.FC<TableActionsColumnProps> = ({
  breakpoint = "sm",
  primaryAction,
  items,
}) => {
  return (
    <Td isActionCell id="row-actions">
      <OverflowMenu breakpoint={breakpoint}>
        {primaryAction}
        {items && <ActionsColumn items={items} />}
      </OverflowMenu>
    </Td>
  );
};
