import * as React from "react";
import { Th } from "@patternfly/react-table";

export interface ITableHeaderContentWithControlsProps {
  numColumnsBeforeData: number;
  numColumnsAfterData: number;
  children: React.ReactNode;
}

export const TableHeaderContentWithControls: React.FC<
  ITableHeaderContentWithControlsProps
> = ({ numColumnsBeforeData, numColumnsAfterData, children }) => (
  <>
    {Array(numColumnsBeforeData)
      .fill(null)
      .map((_, i) => (
        <Th key={i} aria-label="extra column before table data" />
      ))}
    {children}
    {Array(numColumnsAfterData)
      .fill(null)
      .map((_, i) => (
        <Th key={i} aria-label="extra column after table data" />
      ))}
  </>
);
