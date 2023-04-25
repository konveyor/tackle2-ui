import { useSortUrlParams } from "./sorting";
import { usePaginationUrlParams } from "./pagination";
import { ITableControlCommonArgs } from "./types";

export const useTableControlUrlParams = <
  TItem extends { name: string },
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey
>(
  args: ITableControlCommonArgs<TItem, TColumnKey, TSortableColumnKey>
) => {
  const sortState = useSortUrlParams(args);
  const paginationState = usePaginationUrlParams(args);
  return { ...args, sortState, paginationState };
};
