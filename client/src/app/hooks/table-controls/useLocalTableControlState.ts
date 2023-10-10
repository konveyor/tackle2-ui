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
  TFilterCategoryKey extends string = string,
  TPersistenceKeyPrefix extends string = string,
>(
  args: IUseLocalTableControlStateArgs<
    TItem,
    TColumnKey,
    TSortableColumnKey,
    TFilterCategoryKey,
    TPersistenceKeyPrefix
  >
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

  const filterState = useFilterState<
    TItem,
    TFilterCategoryKey,
    TPersistenceKeyPrefix
  >(args);
  const { filteredItems } = getLocalFilterDerivedState({
    ...args,
    items,
    filterCategories,
    filterState,
  });

  const sortState = useSortState<TSortableColumnKey, TPersistenceKeyPrefix>({
    ...args,
    sortableColumns,
    initialSort,
  });
  const { sortedItems } = getLocalSortDerivedState({
    ...args,
    sortState,
    items: filteredItems,
    getSortValues,
  });

  const paginationState = usePaginationState<TPersistenceKeyPrefix>({
    ...args,
    initialItemsPerPage,
  });
  const { currentPageItems } = getLocalPaginationDerivedState({
    ...args,
    paginationState,
    items: sortedItems,
  });

  // TODO bring useSelectionState in from lib-ui, but maybe don't use the persistence because we want to keep the whole selected item object references
  const selectionState = useSelectionState({
    ...args,
    items: filteredItems,
    isEqual: (a, b) => a[idProperty] === b[idProperty],
    initialSelected,
    isItemSelectable,
  });

  const expansionState = useExpansionState<TColumnKey, TPersistenceKeyPrefix>(
    args
  );

  const activeRowState = useActiveRowState<TPersistenceKeyPrefix>(args);

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
