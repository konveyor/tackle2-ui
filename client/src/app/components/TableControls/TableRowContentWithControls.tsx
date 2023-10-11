import React from "react";
import { Td } from "@patternfly/react-table";
import { useTableControlProps } from "@app/hooks/table-controls";

export interface ITableRowContentWithControlsProps<
  TItem,
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
> {
  isExpansionEnabled?: boolean;
  expandableVariant?: "single" | "compound";
  isSelectionEnabled?: boolean;
  propHelpers: ReturnType<
    typeof useTableControlProps<TItem, TColumnKey, TSortableColumnKey>
  >["propHelpers"];
  item: TItem;
  rowIndex: number;
  children: React.ReactNode;
}

export const TableRowContentWithControls = <
  TItem,
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
>({
  isExpansionEnabled = false,
  expandableVariant,
  isSelectionEnabled = false,
  propHelpers: { getSingleExpandTdProps, getSelectCheckboxTdProps },
  item,
  rowIndex,
  children,
}: React.PropsWithChildren<
  ITableRowContentWithControlsProps<TItem, TColumnKey, TSortableColumnKey>
>) => (
  <>
    {isExpansionEnabled && expandableVariant === "single" ? (
      <Td {...getSingleExpandTdProps({ item, rowIndex })} />
    ) : null}
    {isSelectionEnabled ? (
      <Td {...getSelectCheckboxTdProps({ item, rowIndex })} />
    ) : null}
    {children}
  </>
);
