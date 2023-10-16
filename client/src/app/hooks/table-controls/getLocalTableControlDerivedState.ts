import { getLocalFilterDerivedState } from "./filtering";
import { getLocalSortDerivedState } from "./sorting";
import { getLocalPaginationDerivedState } from "./pagination";
import {
  ITableControlLocalDerivedStateArgs,
  ITableControlDerivedState,
  ITableControlState,
} from "./types";

export const getLocalTableControlDerivedState = <
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
  const { filteredItems } = getLocalFilterDerivedState({
    ...args,
    ...(args.isFilterEnabled && { items }),
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
    currentPageItems: isPaginationEnabled ? currentPageItems : sortedItems,
  };
};
