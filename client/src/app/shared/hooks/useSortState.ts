import * as React from "react";
import i18n from "@app/i18n";

// TODO try to use TSortableColumnKey instead of TColumnNames, do that everywhere and try to enforce string keys

export interface IActiveSort<TColumnNames extends Record<string, string>> {
  columnKey: keyof TColumnNames;
  direction: "asc" | "desc";
}

export interface ISortStateArgs<
  TItem,
  TColumnNames extends Record<string, string>
> {
  items: TItem[];
  sortableColumns: (keyof TColumnNames)[];
  getSortValues?: (
    item: TItem
  ) => Record<keyof TColumnNames, string | number | boolean>;
  initialSort: IActiveSort<TColumnNames> | null;
}

export interface ISortStateHook<
  TItem,
  TColumnNames extends Record<string, string>
> {
  activeSort: IActiveSort<TColumnNames> | null;
  setActiveSort: (sort: IActiveSort<TColumnNames> | null) => void;
  sortedItems: TItem[];
}

export const useSortState = <
  TItem,
  TColumnNames extends Record<string, string>
>({
  items,
  sortableColumns,
  getSortValues,
  initialSort = sortableColumns[0]
    ? { columnKey: sortableColumns[0], direction: "asc" }
    : null,
}: ISortStateArgs<TItem, TColumnNames>): ISortStateHook<
  TItem,
  TColumnNames
> => {
  const [activeSort, setActiveSort] = React.useState(initialSort);

  if (!getSortValues || !activeSort)
    return { activeSort, setActiveSort, sortedItems: items };

  let sortedItems = items;
  sortedItems = [...items].sort((a: TItem, b: TItem) => {
    let aValue = getSortValues(a)[activeSort.columnKey];
    let bValue = getSortValues(b)[activeSort.columnKey];
    if (typeof aValue === "string" && typeof bValue === "string") {
      aValue = aValue.replace(/ +/g, "");
      bValue = bValue.replace(/ +/g, "");
      const aSortResult = aValue.localeCompare(bValue, i18n.language);
      const bSortResult = bValue.localeCompare(aValue, i18n.language);
      return activeSort.direction === "asc" ? aSortResult : bSortResult;
    } else if (typeof aValue === "number" && typeof bValue === "number") {
      return activeSort.direction === "asc" ? aValue - bValue : bValue - aValue;
    } else {
      if (aValue > bValue) return activeSort.direction === "asc" ? -1 : 1;
      if (aValue < bValue) return activeSort.direction === "asc" ? -1 : 1;
    }

    return 0;
  });

  return { activeSort, setActiveSort, sortedItems };
};
