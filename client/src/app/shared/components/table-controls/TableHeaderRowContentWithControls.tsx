import React from "react";
import { Th } from "@patternfly/react-table";

export interface ITableHeaderRowContentWithControlsProps {
  numColumnsBeforeData: number;
  numColumnsAfterData: number;
  children: React.ReactNode;
}

export const TableHeaderRowContentWithControls: React.FC<
  ITableHeaderRowContentWithControlsProps
> = ({ numColumnsBeforeData, numColumnsAfterData, children }) => (
  <>
    {Array(numColumnsBeforeData).map((_, i) => (
      <Th key={i} />
    ))}
    {children}
    {Array(numColumnsAfterData).map((_, i) => (
      <Th key={i} />
    ))}
  </>
);
