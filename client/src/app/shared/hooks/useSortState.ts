import * as React from "react";
import { ISortBy, SortByDirection } from "@patternfly/react-table";
import i18n from "@app/i18n";
import { IGroupVersionKindPlural } from "@migtools/lib-ui";

// TODO refactor to use columnIndex
// TODO only return simple state
// TODO separate the props stuff into useSortProps or getSortProps
// TODO integrate that into useTableControlProps

export interface ISortStateHook<TItem, TSortableColumnKey extends string> {
  activeSortColumn: TSortableColumnKey | null;
  activeSortDirection: "asc" | "desc";
  setSort: (column: TSortableColumnKey, direction: "asc" | "desc") => void;
  sortedItems: TItem[];
}

// TODO change this to work by columnKeys instead of column index?

export const useSortState = <TItem, TSortableColumnKey extends string>(
  items: TItem[],
  sortableColumns: TSortableColumnKey[],
  getSortValues?: (
    item: TItem
  ) => Record<TSortableColumnKey, string | number | boolean>,
  initialSortColumn: TSortableColumnKey | null = sortableColumns[0] || null,
  initialSortDirection: "asc" | "desc" = "asc"
): ISortStateHook<TItem, TSortableColumnKey> => {
  const [activeSortColumn, setActiveSortColumn] =
    React.useState<TSortableColumnKey | null>(initialSortColumn);
  const [activeSortDirection, setActiveSortDirection] = React.useState<
    "asc" | "desc"
  >(initialSortDirection);

  const setSort = (column: TSortableColumnKey, direction: "asc" | "desc") => {
    setActiveSortColumn(column);
    setActiveSortDirection(direction);
  };

  if (!getSortValues || !activeSortColumn)
    return {
      activeSortColumn,
      activeSortDirection,
      setSort,
      sortedItems: items,
    };

  let sortedItems = items;
  sortedItems = [...items].sort((a: TItem, b: TItem) => {
    let aValue = getSortValues(a)[activeSortColumn];
    let bValue = getSortValues(b)[activeSortColumn];
    if (typeof aValue === "string" && typeof bValue === "string") {
      aValue = aValue.replace(/ +/g, "");
      bValue = bValue.replace(/ +/g, "");
      const aSortResult = aValue.localeCompare(bValue, i18n.language);
      const bSortResult = bValue.localeCompare(aValue, i18n.language);
      return activeSortDirection === "asc" ? aSortResult : bSortResult;
    } else if (typeof aValue === "number" && typeof bValue === "number") {
      return activeSortDirection === "asc" ? aValue - bValue : bValue - aValue;
    } else {
      if (aValue > bValue) return activeSortDirection === "asc" ? -1 : 1;
      if (aValue < bValue) return activeSortDirection === "asc" ? -1 : 1;
    }

    return 0;
  });

  return { activeSortColumn, activeSortDirection, setSort, sortedItems };
};
