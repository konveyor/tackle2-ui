import React from "react";
import { Td } from "@patternfly/react-table";
import {
  useTableControlProps,
  useTableControls,
} from "@app/shared/hooks/use-table-controls";

export interface ITableRowContentWithControlsProps<
  TItem extends { name: string },
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey
> {
  isSelectable?: boolean;
  propHelpers: ReturnType<
    typeof useTableControlProps<TItem, TColumnKey, TSortableColumnKey>
  >["propHelpers"];
  item: TItem;
  rowIndex: number;
  children: React.ReactNode;
}

// TODO implement single-expandable toggle cell

export const TableRowContentWithControls = <
  TItem extends { name: string },
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey
>({
  isSelectable = false,
  propHelpers: { getSelectCheckboxTdProps },
  item,
  rowIndex,
  children,
}: React.PropsWithChildren<
  ITableRowContentWithControlsProps<TItem, TColumnKey, TSortableColumnKey>
>) => (
  <>
    {/* TODO implement single-expandable toggle cell */}
    {isSelectable ? (
      <Td {...getSelectCheckboxTdProps({ item, rowIndex })} />
    ) : null}
    {children}
  </>
);
