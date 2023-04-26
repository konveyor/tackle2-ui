import { useLegacyFilterState } from "../useLegacyFilterState";
import { useCompoundExpansionState } from "../useCompoundExpansionState";
import { useSelectionState } from "@migtools/lib-ui";
import {
  useLocalPaginationDerivedState,
  usePaginationState,
} from "./pagination";
import { useSortState, useLocalSortDerivedState } from "./sorting";
import { IUseTableControlStateArgs, IUseTableControlPropsArgs } from "./types";

export const useLocalTableControlState = <
  TItem extends { name: string },
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey
>(
  args: IUseTableControlStateArgs<TItem, TColumnKey, TSortableColumnKey>
): IUseTableControlPropsArgs<TItem, TColumnKey, TSortableColumnKey> => {
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

  const filterState = useLegacyFilterState(
    items,
    filterCategories,
    filterStorageKey
  );

  const expansionState = useCompoundExpansionState<TItem, TColumnKey>();

  const selectionState = useSelectionState({
    items: filterState.filteredItems,
    isEqual: (a, b) => a.name === b.name,
  });

  const sortState = useSortState({ sortableColumns, initialSort });
  const { sortedItems } = useLocalSortDerivedState({
    sortState,
    items: filterState.filteredItems,
    getSortValues,
  });

  const paginationState = usePaginationState({
    initialItemsPerPage,
  });
  const { currentPageItems } = useLocalPaginationDerivedState({
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
