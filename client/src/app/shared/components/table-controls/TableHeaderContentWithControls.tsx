import React from "react";
import { Th } from "@patternfly/react-table";
import { useTableControls } from "@app/shared/hooks/use-table-controls";

export interface ITableHeaderContentWithControlsProps<
  TItem extends { name: string },
  TColumnNames extends Record<string, string>
> extends ReturnType<typeof useTableControls<TItem, TColumnNames>> {
  children: React.ReactNode;
}

export const TableHeaderContentWithControls = <
  TItem extends { name: string },
  TColumnNames extends Record<string, string>
>({
  numColumnsBeforeData,
  numColumnsAfterData,
  children,
}: ITableHeaderContentWithControlsProps<TItem, TColumnNames>) => (
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
