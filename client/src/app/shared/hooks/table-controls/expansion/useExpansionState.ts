import { KeyWithValueType } from "@app/utils/type-utils";
import React from "react";

export const useExpansionState = <TItem, TColumnKey extends string>(
  idProperty: KeyWithValueType<TItem, string | number>
) => {
  // TExpandedCells maps item names to either:
  //  - The key of an expanded column in that row, if the table is compound-expandable
  //  - The `true` literal value (the entire row is expanded), if non-compound-expandable
  type TExpandedCells = Record<string, TColumnKey | boolean>;

  const [expandedCells, setExpandedCells] = React.useState<TExpandedCells>({});
  const setCellExpanded = ({
    item,
    isExpanding = true,
    columnKey,
  }: {
    item: TItem;
    isExpanding?: boolean;
    columnKey?: TColumnKey; // Pass a columnKey for compound-expand, or omit it for single-expand
  }) => {
    const newExpandedCells = { ...expandedCells };
    if (isExpanding) {
      newExpandedCells[String(item[idProperty])] = columnKey || true;
    } else {
      delete newExpandedCells[String(item[idProperty])];
    }
    setExpandedCells(newExpandedCells);
  };

  // isCellExpanded:
  //  - If called with a columnKey, returns whether that specific cell is expanded
  //  - If called without a columnKey, returns whether the row is expanded at all
  const isCellExpanded = (item: TItem, columnKey?: TColumnKey) => {
    return columnKey
      ? expandedCells[String(item[idProperty])] === columnKey
      : !!expandedCells[String(item[idProperty])];
  };

  return {
    expandedCells,
    setCellExpanded,
    isCellExpanded,
  };
};
