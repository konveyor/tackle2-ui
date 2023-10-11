import { getLocalFilterDerivedState } from "./filtering";
import { getLocalSortDerivedState } from "./sorting";
import { getLocalPaginationDerivedState } from "./pagination";
import {
  IGetLocalTableControlDerivedStateArgs,
  IUseTableControlPropsArgs,
} from "./types";

export const getLocalTableControlDerivedState = <
  TItem,
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
  TFilterCategoryKey extends string = string,
  TPersistenceKeyPrefix extends string = string,
>(
  args: IGetLocalTableControlDerivedStateArgs<
    TItem,
    TColumnKey,
    TSortableColumnKey,
    TFilterCategoryKey,
    TPersistenceKeyPrefix
  >
): Omit<
  IUseTableControlPropsArgs<TItem, TColumnKey, TSortableColumnKey>,
  "selectionState" // TODO we won't need to omit this once selection state is part of useTableControlState
> => {
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
    ...args,
    totalItemCount: items.length,
    currentPageItems: hasPagination ? currentPageItems : sortedItems,
  };
};
