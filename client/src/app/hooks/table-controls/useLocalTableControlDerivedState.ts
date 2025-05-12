import { getLocalFilterDerivedState } from "./filtering";
import { getLocalSortDerivedState } from "./sorting";
import { getLocalPaginationDerivedState } from "./pagination";
import {
  ITableControlLocalDerivedStateArgs,
  ITableControlDerivedState,
  ITableControlState,
} from "./types";
import { useMemo } from "react";

/**
 * Returns table-level "derived state" (the results of local/client-computed filtering/sorting/pagination)
 * - Used internally by the shorthand hook useLocalTableControls.
 * - Takes "source of truth" state for all features and additional args.
 * @see useLocalTableControls
 */
export const useLocalTableControlDerivedState = <
  TItem,
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
  TFilterCategoryKey extends string = string,
  TPersistenceKeyPrefix extends string = string,
>(
  args: ITableControlState<
    TItem,
    TColumnKey,
    TSortableColumnKey,
    TFilterCategoryKey,
    TPersistenceKeyPrefix
  > &
    ITableControlLocalDerivedStateArgs<
      TItem,
      TColumnKey,
      TSortableColumnKey,
      TFilterCategoryKey
    >
): ITableControlDerivedState<TItem> => {
  const { items, isPaginationEnabled = true } = args;

  const { filteredItems } = useMemo(
    () =>
      getLocalFilterDerivedState({
        items,
        filterCategories: args.filterCategories,
        filterState: args.filterState,
      }),
    [items, args.filterCategories, args.filterState]
  );

  const { sortedItems } = useMemo(
    () =>
      getLocalSortDerivedState({
        items: filteredItems,
        getSortValues: args.getSortValues,
        sortState: args.sortState,
      }),
    [filteredItems, args.getSortValues, args.sortState]
  );

  const { currentPageItems } = useMemo(
    () =>
      getLocalPaginationDerivedState({
        items: sortedItems,
        paginationState: args.paginationState,
      }),
    [sortedItems, args.paginationState]
  );

  return {
    filteredItems,
    totalItemCount: filteredItems.length,
    currentPageItems: isPaginationEnabled ? currentPageItems : sortedItems,
  };
};
