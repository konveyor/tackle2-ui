import { FilterCategory } from "@app/shared/components/FilterToolbar";
import { useFilterState } from "../useFilterState";
import { useCompoundExpansionState } from "../useCompoundExpansionState";
import { useSelectionState } from "@migtools/lib-ui";
import { usePaginationState } from "../usePaginationState";
import { useSortState } from "../useSortState";

export interface UseTableControlStateArgs<
  TItem extends { name: string },
  TColumnNames extends Record<string, string>
> {
  items: TItem[]; // The objects represented by rows in this table
  columnNames: TColumnNames; // An ordered mapping of unique keys to human-readable column name strings
  filterCategories?: FilterCategory<TItem>[];
  filterStorageKey?: string;
  sortableColumns?: (keyof TColumnNames)[]; // TODO can we limit this to a subset of sortable keys and have that enforced?
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
    filterCategories = [],
    filterStorageKey,
    sortableColumns = [],
    getSortValues,
    initialSort = null,
    hasPagination = true,
    initialItemsPerPage = 10,
  } = args;

  const filterState = useFilterState(items, filterCategories, filterStorageKey);

  const expansionState = useCompoundExpansionState<TItem, TColumnNames>();

  const selectionState = useSelectionState<TItem>({
    items: filterState.filteredItems,
    isEqual: (a, b) => a.name === b.name,
  });

  const sortState = useSortState({
    items: filterState.filteredItems,
    sortableColumns,
    getSortValues,
    initialSort,
  });

  const paginationState = usePaginationState(
    sortState.sortedItems,
    initialItemsPerPage
  );

  return {
    ...args,
    totalItemCount: items.length,
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
