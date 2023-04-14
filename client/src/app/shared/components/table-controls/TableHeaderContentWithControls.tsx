import React from "react";
import { Th } from "@patternfly/react-table";
import { useTableControls } from "@app/shared/hooks/use-table-controls";

export interface ITableHeaderContentWithControlsProps<
  TItem extends { name: string },
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey
> extends ReturnType<
    typeof useTableControls<TItem, TColumnKey, TSortableColumnKey>
  > {
  children: React.ReactNode;
}

export const TableHeaderContentWithControls = <
  TItem extends { name: string },
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey
>({
  numColumnsBeforeData,
  numColumnsAfterData,
  children,
}: ITableHeaderContentWithControlsProps<
  TItem,
  TColumnKey,
  TSortableColumnKey
>) => (
  <>
    {Array(numColumnsBeforeData)
      .fill(null)
      .map((_, i) => (
        <Th key={i} />
      ))}
    {children}
    {Array(numColumnsAfterData)
      .fill(null)
      .map((_, i) => (
        <Th key={i} />
      ))}
  </>
);
