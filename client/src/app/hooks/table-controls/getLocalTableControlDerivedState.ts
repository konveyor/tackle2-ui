import { getLocalFilterDerivedState } from "./filtering";
import { getLocalSortDerivedState } from "./sorting";
import { getLocalPaginationDerivedState } from "./pagination";
import {
  ITableControlLocalDerivedStateArgs,
  ITableControlDerivedState,
} from "./types";
import { useTableControlState } from "./useTableControlState";

export const getLocalTableControlDerivedState = <
  TItem,
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
  TFilterCategoryKey extends string = string,
  TPersistenceKeyPrefix extends string = string,
>(
  args: ITableControlLocalDerivedStateArgs<
    TItem,
    TColumnKey,
    TSortableColumnKey,
    TFilterCategoryKey
  > &
    // TODO make this an explicit type
    ReturnType<
      typeof useTableControlState<
        TItem,
        TColumnKey,
        TSortableColumnKey,
        TFilterCategoryKey,
        TPersistenceKeyPrefix
      >
    >
): ITableControlDerivedState<TItem> => {
  const { items, hasPagination = true } = args;
  const { filteredItems } = getLocalFilterDerivedState({
    ...args,
    items,
  });
  const { sortedItems } = getLocalSortDerivedState({
    ...args,
    items: filteredItems,
  });
  const { currentPageItems } = getLocalPaginationDerivedState({
    ...args,
    items: sortedItems,
  });
  return {
    totalItemCount: items.length,
    currentPageItems: hasPagination ? currentPageItems : sortedItems,
  };
};
