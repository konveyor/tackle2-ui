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
  // Generic type params for each of these hooks are inferred from the args object
  const filterState = useFilterState(args);
  const sortState = useSortState(args);
  const paginationState = usePaginationState(args);
  const expansionState = useExpansionState(args);
  const activeRowState = useActiveRowState(args);
  return {
    ...args,
    filterState,
    sortState,
    paginationState,
    expansionState,
    activeRowState,
  };
};
