import { IUseTableControlStateArgs } from "./types";
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
  // Must pass type params because they can't all be inferred from the required args of useFilterState
  const filterState = useFilterState<
    TItem,
    TFilterCategoryKey, // Must pass this because no required args here have categories to infer from
    TPersistenceKeyPrefix
  >(args);
  const sortState = useSortState(args); // Type params inferred from args
  const paginationState = usePaginationState(args); // Type params inferred from args
  // Must pass type params because they can't all be inferred from the required args of useExpansionState
  // TODO is that still true here?
  const expansionState = useExpansionState<TColumnKey, TPersistenceKeyPrefix>(
    args
  );
  const activeRowState = useActiveRowState(args); // Type params inferred from args
  return {
    ...args,
    filterState,
    sortState,
    paginationState,
    expansionState,
    activeRowState,
  };
};
