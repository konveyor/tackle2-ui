import { FilterCategory } from "@app/shared/components/FilterToolbar";
import { useFilterState } from "../useFilterState";
import { useCompoundExpansionState } from "../useCompoundExpansionState";
import { useSelectionState } from "@migtools/lib-ui";
import { useSortState } from "../useSortState";
import { usePaginationState } from "../usePaginationState";
import { objectKeys } from "@app/utils/utils";

export interface UseTableControlStateArgs<
  TItem extends { name: string },
  TColumnNames extends Record<string, string>
> {
  items: TItem[]; // The objects represented by rows in this table
  columnNames: TColumnNames; // An ordered mapping of unique keys to human-readable column name strings
  filterCategories?: FilterCategory<TItem>[];
  filterStorageKey?: string;
  getSortValues?: (item: TItem) => Record<keyof TColumnNames, string | number>;
  initialSort?: { columnKey: keyof TColumnNames; direction: "asc" | "desc" };
  hasPagination?: boolean;
  initialItemsPerPage?: number;
}

export const useTableControlState = <
  TItem extends { name: string },
  TColumnNames extends Record<string, string>
>(
  args: UseTableControlStateArgs<TItem, TColumnNames>
) => {
  const {
    items,
    columnNames,
    filterCategories = [],
    filterStorageKey,
    getSortValues,
    initialSort,
    hasPagination = true,
    initialItemsPerPage = 10,
  } = args;

  const filterState = useFilterState(items, filterCategories, filterStorageKey);

  const expansionState = useCompoundExpansionState<TItem, TColumnNames>();

  const selectionState = useSelectionState<TItem>({
    items: filterState.filteredItems || [],
    isEqual: (a, b) => a.name === b.name,
  });

  const sortState = useSortState(
    filterState.filteredItems,
    getSortValues
      ? (item) => {
          // Because useSortState is based on column indexes and we want to base everything on columnKey,
          // we need to convert to an array of strings based on column index here.
          // TODO rewrite or write an alternate useSortState to be based on columnKey instead.
          const sortValuesByColumnKey = getSortValues(item);
          return [
            ...objectKeys(columnNames).map(
              (columnKey) => sortValuesByColumnKey[columnKey] || ""
            ),
          ];
        }
      : undefined,
    initialSort
      ? {
          index: objectKeys(columnNames).indexOf(initialSort.columnKey),
          direction: initialSort.direction,
        }
      : undefined
  );

  const paginationState = usePaginationState(
    sortState.sortedItems,
    initialItemsPerPage
  );

  return {
    ...args,
    filterState,
    expansionState,
    selectionState,
    sortState,
    paginationState: {
      ...paginationState,
      currentPageItems: hasPagination
        ? paginationState.currentPageItems
        : sortState.sortedItems,
    },
  };
};
