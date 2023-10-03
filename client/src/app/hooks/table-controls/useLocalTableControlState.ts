import { useSelectionState } from "@migtools/lib-ui";
import { getLocalFilterDerivedState, useFilterState } from "./filtering";
import { useSortState, getLocalSortDerivedState } from "./sorting";
import {
  getLocalPaginationDerivedState,
  usePaginationState,
} from "./pagination";
import { useExpansionState } from "./expansion";
import { useActiveRowState } from "./active-row";
import {
  IUseLocalTableControlStateArgs,
  IUseTableControlPropsArgs,
} from "./types";

export const useLocalTableControlState = <
  TItem,
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
>(
  args: IUseLocalTableControlStateArgs<TItem, TColumnKey, TSortableColumnKey>
): IUseTableControlPropsArgs<TItem, TColumnKey, TSortableColumnKey> => {
  const {
    items,
    filterCategories = [],
    sortableColumns = [],
    getSortValues,
    initialSort = null,
    hasPagination = true,
    initialItemsPerPage = 10,
    idProperty,
    initialSelected,
    isItemSelectable,
  } = args;

  const filterState = useFilterState(args);
  const { filteredItems } = getLocalFilterDerivedState({
    ...args,
    items,
    filterCategories,
    filterState,
  });

  const sortState = useSortState({ ...args, sortableColumns, initialSort });
  const { sortedItems } = getLocalSortDerivedState({
    ...args,
    sortState,
    items: filteredItems,
    getSortValues,
  });

  const paginationState = usePaginationState({
    ...args,
    initialItemsPerPage,
  });
  const { currentPageItems } = getLocalPaginationDerivedState({
    ...args,
    paginationState,
    items: sortedItems,
  });

  const selectionState = useSelectionState({
    ...args,
    items: filteredItems,
    isEqual: (a, b) => a[idProperty] === b[idProperty],
    initialSelected,
    isItemSelectable,
  });

  const expansionState = useExpansionState<TColumnKey>(args);

  const activeRowState = useActiveRowState(args);

  return {
    ...args,
    filterState,
    expansionState,
    selectionState,
    sortState,
    paginationState,
    activeRowState,
    totalItemCount: items.length,
    currentPageItems: hasPagination ? currentPageItems : sortedItems,
  };
};
