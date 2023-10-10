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
  const filterState = useFilterState<
    TItem,
    TFilterCategoryKey,
    TPersistenceKeyPrefix
  >(args);
  const sortState = useSortState<TSortableColumnKey, TPersistenceKeyPrefix>(
    args
  );
  const paginationState = usePaginationState<TPersistenceKeyPrefix>(args);
  const expansionState = useExpansionState<TColumnKey, TPersistenceKeyPrefix>(
    args
  );
  const activeRowState = useActiveRowState<TPersistenceKeyPrefix>(args);
  return {
    ...args,
    filterState,
    sortState,
    paginationState,
    expansionState,
    activeRowState,
  };
};
