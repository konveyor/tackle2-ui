import { IUseTableControlStateArgs, PersistTarget } from "./types";
import { useFilterState } from "./filtering";
import { useSortState } from "./sorting";
import { usePaginationState } from "./pagination";
import { useActiveRowState } from "./active-row";
import { useExpansionState } from "./expansion";

export const useTableControlState = <
  TItem,
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
  TFilterCategoryKey extends string = string,
  TPersistenceKeyPrefix extends string = string,
>(
  args: IUseTableControlStateArgs<
    TItem,
    TColumnKey,
    TSortableColumnKey,
    TFilterCategoryKey,
    TPersistenceKeyPrefix
  >
) => {
  const getPersistTo = (
    feature: "filters" | "sort" | "pagination" | "expansion" | "activeRow"
  ): PersistTarget | undefined =>
    !args.persistTo || typeof args.persistTo === "string"
      ? args.persistTo
      : args.persistTo[feature] || args.persistTo.default;

  const filterState = useFilterState<
    TItem,
    TFilterCategoryKey,
    TPersistenceKeyPrefix
  >({ ...args, persistTo: getPersistTo("filters") });
  const sortState = useSortState<TSortableColumnKey, TPersistenceKeyPrefix>({
    ...args,
    persistTo: getPersistTo("sort"),
  });
  const paginationState = usePaginationState<TPersistenceKeyPrefix>({
    ...args,
    persistTo: getPersistTo("pagination"),
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
    sortState,
    paginationState,
    expansionState,
    activeRowState,
  };
};
