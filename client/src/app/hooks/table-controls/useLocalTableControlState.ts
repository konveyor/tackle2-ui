import { useSelectionState } from "@migtools/lib-ui";
import { getLocalFilterDerivedState } from "./filtering";
import { getLocalSortDerivedState } from "./sorting";
import { getLocalPaginationDerivedState } from "./pagination";
import {
  IUseLocalTableControlStateArgs,
  IUseTableControlPropsArgs,
} from "./types";
import { useTableControlState } from "./useTableControlState";

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
  const { items, hasPagination = true, idProperty } = args;

  const tableControlState = useTableControlState(args);

  const { filteredItems } = getLocalFilterDerivedState({
    ...tableControlState,
    items,
  });

  const { sortedItems } = getLocalSortDerivedState({
    ...tableControlState,
    items: filteredItems,
  });

  const { currentPageItems } = getLocalPaginationDerivedState({
    ...tableControlState,
    items: sortedItems,
  });

  // TODO bring useSelectionState in from lib-ui, but maybe don't use the persistence because we want to keep the whole selected item object references
  const selectionState = useSelectionState({
    ...args,
    items: filteredItems,
    isEqual: (a, b) => a[idProperty] === b[idProperty],
  });

  return {
    ...args,
    ...tableControlState,
    selectionState,
    totalItemCount: items.length,
    currentPageItems: hasPagination ? currentPageItems : sortedItems,
  };
};
