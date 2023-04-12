import React from "react";
import { Td } from "@patternfly/react-table";
import { useTableControls } from "@app/shared/hooks/use-table-controls";

export interface ITableRowContentWithControlsProps<
  TItem extends { name: string },
  TColumnNames extends Record<string, string>
> extends ReturnType<typeof useTableControls<TItem, TColumnNames>> {
  item: TItem;
  rowIndex: number;
  children: React.ReactNode;
}

// TODO implement single-expandable toggle cell

export const TableRowContentWithControls = <
  TItem extends { name: string },
  TColumnNames extends Record<string, string>
>({
  isSelectable = false,
  propHelpers: { getSelectCheckboxTdProps },
  item,
  rowIndex,
  children,
}: React.PropsWithChildren<
  ITableRowContentWithControlsProps<TItem, TColumnNames>
>) => (
  <>
    {/* TODO implement single-expandable toggle cell */}
    {isSelectable ? (
      <Td {...getSelectCheckboxTdProps({ item, rowIndex })} />
    ) : null}
    {children}
  </>
);
