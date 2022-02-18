import * as React from "react";
import { ISortBy, SortByDirection } from "@patternfly/react-table";

export interface ISortStateHook<T> {
  sortBy: ISortBy;
  onSort: (
    event: React.SyntheticEvent,
    index: number,
    direction: SortByDirection
  ) => void;
  sortedItems: T[];
}

export const useSortState = <T>(
  items: T[],
  getSortValues: (item: T) => (string | number | boolean)[],
  initialSort: ISortBy = { index: 0, direction: "asc" }
): ISortStateHook<T> => {
  const [sortBy, setSortBy] = React.useState<ISortBy>(initialSort);
  const onSort = (
    event: React.SyntheticEvent,
    index: number,
    direction: SortByDirection
  ) => {
    setSortBy({ index, direction });
  };

  let sortedItems = items;
  if (sortBy.index !== undefined && sortBy.direction !== undefined) {
    sortedItems = [...items].sort((a: T, b: T) => {
      const { index, direction } = sortBy;
      const aValue = getSortValues(a)[index || 0];
      const bValue = getSortValues(b)[index || 0];
      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  return { sortBy, onSort, sortedItems };
};
