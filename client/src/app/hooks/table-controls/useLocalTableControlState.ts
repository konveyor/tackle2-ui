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
  PersistTarget,
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
    hasPagination = true,
    idProperty,
    initialSelected,
    isItemSelectable,
  } = args;

  const getPersistTo = (
    feature: "filters" | "sort" | "pagination" | "expansion" | "activeRow"
  ): PersistTarget | undefined =>
    !args.persistTo || typeof args.persistTo === "string"
      ? args.persistTo
      : args.persistTo[feature];

  const filterState = useFilterState<
    TItem,
    TFilterCategoryKey,
    TPersistenceKeyPrefix
  >({ ...args, persistTo: getPersistTo("filters") });
  const { filteredItems } = getLocalFilterDerivedState({
    ...args,
    items,
    filterState,
  });

  const sortState = useSortState<TSortableColumnKey, TPersistenceKeyPrefix>({
    ...args,
    persistTo: getPersistTo("sort"),
  });
  const { sortedItems } = getLocalSortDerivedState({
    ...args,
    sortState,
    items: filteredItems,
  });

  const paginationState = usePaginationState<TPersistenceKeyPrefix>({
    ...args,
    persistTo: getPersistTo("pagination"),
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

  const expansionState = useExpansionState<TColumnKey, TPersistenceKeyPrefix>({
    ...args,
    persistTo: getPersistTo("expansion"),
  });

  const activeRowState = useActiveRowState<TPersistenceKeyPrefix>({
    ...args,
    persistTo: getPersistTo("activeRow"),
  });

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
