import { useSelectionState } from "@migtools/lib-ui";
import {
  getLocalFilterDerivedState,
  useFilterState,
  useFilterUrlParams,
} from "./filtering";
import {
  useSortState,
  getLocalSortDerivedState,
  useSortUrlParams,
} from "./sorting";
import {
  getLocalPaginationDerivedState,
  usePaginationState,
  usePaginationUrlParams,
} from "./pagination";
import { useExpansionState, useExpansionUrlParams } from "./expansion";
import { useActiveRowState, useActiveRowUrlParams } from "./active-row";
import {
  IExtraArgsForURLParamHooks,
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
    items,
    filterCategories,
    filterState,
  });

  const selectionState = useSelectionState({
    items: filteredItems,
    isEqual: (a, b) => a[idProperty] === b[idProperty],
    initialSelected,
    isItemSelectable,
  });

  const sortState = useSortState({ sortableColumns, initialSort });
  const { sortedItems } = getLocalSortDerivedState({
    sortState,
    items: filteredItems,
    getSortValues,
  });

  const paginationState = usePaginationState({
    initialItemsPerPage,
  });
  const { currentPageItems } = getLocalPaginationDerivedState({
    paginationState,
    items: sortedItems,
  });

  const expansionState = useExpansionState<TColumnKey>();

  const activeRowState = useActiveRowState();

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

// TODO refactor useUrlParams so it can be used conditionally (e.g. useStateOrUrlParams) so we don't have to duplicate all this.
//      this would mean all use[Feature]UrlParams hooks could be consolidated into use[Feature]State with a boolean option for whether to use URL params.

export const useLocalTableControlUrlParams = <
  TItem,
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
  TURLParamKeyPrefix extends string = string,
>(
  args: IUseLocalTableControlStateArgs<TItem, TColumnKey, TSortableColumnKey> &
    IExtraArgsForURLParamHooks<TURLParamKeyPrefix>
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

  const filterState = useFilterUrlParams(args);
  const { filteredItems } = getLocalFilterDerivedState({
    items,
    filterCategories,
    filterState,
  });

  const selectionState = useSelectionState({
    items: filteredItems,
    isEqual: (a, b) => a[idProperty] === b[idProperty],
    initialSelected,
    isItemSelectable,
  });

  const sortState = useSortUrlParams({ ...args, sortableColumns, initialSort });
  const { sortedItems } = getLocalSortDerivedState({
    sortState,
    items: filteredItems,
    getSortValues,
  });

  const paginationState = usePaginationUrlParams({
    ...args,
    initialItemsPerPage,
  });
  const { currentPageItems } = getLocalPaginationDerivedState({
    paginationState,
    items: sortedItems,
  });

  const expansionState = useExpansionUrlParams<TColumnKey>(args);

  const activeRowState = useActiveRowUrlParams(args);

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
