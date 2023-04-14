import React from "react";

export const useCompoundExpansionState = <
  TItem extends { name: string },
  TColumnKey extends string
>() => {
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
    columnKey?: TColumnKey;
  }) => {
    const newExpandedCells = { ...expandedCells };
    if (isExpanding) {
      newExpandedCells[item.name] = columnKey || true;
    } else {
      delete newExpandedCells[item.name];
    }
    setExpandedCells(newExpandedCells);
  };

  // isCellExpanded:
  //  - If called with a columnKey, returns whether that specific cell is expanded
  //  - If called without a columnKey, returns whether the row is expanded at all
  const isCellExpanded = (item: TItem, columnKey?: TColumnKey) =>
    columnKey
      ? expandedCells[item.name] === columnKey
      : !!expandedCells[item.name];

  // TODO we will need to adapt this to regular-expandable and not just compound-expandable
  // (probably just means the addition of returned props to render an expandToggleTd in useTableControls)

  return {
    expandedCells,
    setCellExpanded,
    isCellExpanded,
  };
};
