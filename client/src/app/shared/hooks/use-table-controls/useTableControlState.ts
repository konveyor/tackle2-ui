import { FilterCategory } from "@app/shared/components/FilterToolbar";
import { useFilterState } from "../useFilterState";
import { useCompoundExpansionState } from "../useCompoundExpansionState";
import { useSelectionState } from "@migtools/lib-ui";
import { usePaginationDerivedState, usePaginationState } from "./paginate";
import { useSortState, useSortDerivedState } from "./sort";

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

  // TODO move the derived state stuff to the step between useTableControlState and useTableControlProps in useTableControls?

  const filterState = useFilterState(items, filterCategories, filterStorageKey);

  const expansionState = useCompoundExpansionState<TItem, TColumnKey>();

  const selectionState = useSelectionState({
    items: filterState.filteredItems,
    isEqual: (a, b) => a.name === b.name,
  });

  const sortState = useSortState({ sortableColumns, initialSort });
  const { sortedItems } = useSortDerivedState({
    sortState,
    items: filterState.filteredItems,
    getSortValues,
  });

  const paginationState = usePaginationState({
    initialItemsPerPage,
  });
  const { currentPageItems } = usePaginationDerivedState({
    paginationState,
    items,
  });

  return {
    ...args,
    filterState,
    expansionState,
    selectionState,
    sortState,
    paginationState,
    totalItemCount: items.length,
    currentPageItems: hasPagination ? currentPageItems : sortedItems,
  };
};
