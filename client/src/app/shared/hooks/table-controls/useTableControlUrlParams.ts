import { ITableControlCommonArgs } from "./types";
import { useFilterUrlParams } from "./filtering";
import { useSortUrlParams } from "./sorting";
import { usePaginationUrlParams } from "./pagination";
import { useActiveRowUrlParams } from "./active-row";
import { useExpansionUrlParams } from "./expansion";

export const useTableControlUrlParams = <
  TItem,
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
  TFilterCategoryKey extends string = string
>(
  args: ITableControlCommonArgs<
    TItem,
    TColumnKey,
    TSortableColumnKey,
    TFilterCategoryKey
  >
) => {
  const filterState = useFilterUrlParams<TFilterCategoryKey>(); // Must pass type param because no args to infer from
  const sortState = useSortUrlParams(args); // Type params inferred from args
  const paginationState = usePaginationUrlParams(args); // Type params inferred from args
  const expansionState = useExpansionUrlParams<TColumnKey>(); // Must pass type param because no args to infer from
  const activeRowState = useActiveRowUrlParams(); // No type params or args needed
  return {
    ...args,
    filterState,
    sortState,
    paginationState,
    expansionState,
    activeRowState,
  };
};
