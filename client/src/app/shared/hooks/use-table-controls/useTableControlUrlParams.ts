import { ISortStateArgs, useSortUrlParams } from "./sort";
import { IPaginationStateArgs, usePaginationUrlParams } from "./paginate";

export type TableControlUrlParamsArgs<
  TItem extends { name: string },
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey // A subset of column keys as a separate narrower type
> = ISortStateArgs<TSortableColumnKey> & IPaginationStateArgs;

export const useTableControlUrlParams = <
  TItem extends { name: string },
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey
>(
  args: TableControlUrlParamsArgs<TItem, TColumnKey, TSortableColumnKey>
) => {
  const sortState = useSortUrlParams(args);
  const paginationState = usePaginationUrlParams(args);
  return { ...args, sortState, paginationState };
};
