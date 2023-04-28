import { useSortUrlParams } from "./sorting";
import { usePaginationUrlParams } from "./pagination";
import { ITableControlCommonArgs } from "./types";
import { useFilterUrlParams } from "./filtering";

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
  const filterState = useFilterUrlParams<TFilterCategoryKey>();
  const sortState = useSortUrlParams(args);
  const paginationState = usePaginationUrlParams(args);
  return { ...args, filterState, sortState, paginationState };
};
