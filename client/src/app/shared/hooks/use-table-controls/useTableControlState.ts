import { FilterCategory } from "@app/shared/components/FilterToolbar";
import { useFilterState } from "../useFilterState";
import { useCompoundExpansionState } from "../useCompoundExpansionState";
import { useSelectionState } from "@migtools/lib-ui";
import { usePaginationState } from "../usePaginationState";
import { useSortState } from "../useSortState";

export interface UseTableControlStateArgs<
  TItem extends { name: string },
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey // A subset of column keys as a separate narrower type
> {
  items: TItem[]; // The objects represented by rows in this table
  columnNames: Record<TColumnKey, string>; // An ordered mapping of unique keys to human-readable column name strings
  filterCategories?: FilterCategory<TItem>[];
  filterStorageKey?: string;
  sortableColumns?: TSortableColumnKey[];
  getSortValues?: (item: TItem) => Record<TSortableColumnKey, string | number>;
  initialSort?: { columnKey: TSortableColumnKey; direction: "asc" | "desc" };
  hasPagination?: boolean;
  initialItemsPerPage?: number;
}

export const useTableControlState = <
  TItem extends { name: string },
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey
>(
  args: UseTableControlStateArgs<TItem, TColumnKey, TSortableColumnKey>
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

  const expansionState = useCompoundExpansionState<TItem, TColumnKey>();

  const selectionState = useSelectionState({
    items: filterState.filteredItems,
    isEqual: (a, b) => a.name === b.name,
  });

  const sortState = useSortState({
    items: filterState.filteredItems,
    sortableColumns,
    getSortValues,
    initialSort,
  });

  const paginationState = usePaginationState({
    items: sortState.sortedItems,
    initialItemsPerPage,
  });

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
