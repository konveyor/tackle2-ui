import { ThProps } from "@patternfly/react-table";
import { ISortState } from "./useSortState";

// Args that are part of IUseTableControlPropsArgs (the args for useTableControlProps)
export interface ISortPropsArgs<
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
> {
  sortState: ISortState<TSortableColumnKey>;
  sortableColumns: TSortableColumnKey[];
}

// Additional args that need to be passed in on a per-column basis
export interface IGetSortPropsArgs<
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
> extends ISortPropsArgs<TColumnKey, TSortableColumnKey> {
  columnKeys: TColumnKey[];
  columnKey: TSortableColumnKey;
}

export const getSortProps = <
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
>({
  sortState: { activeSort, setActiveSort },
  sortableColumns,
  columnKeys,
  columnKey,
}: IGetSortPropsArgs<TColumnKey, TSortableColumnKey>): {
  th: Pick<ThProps, "sort">;
} => ({
  th: sortableColumns.includes(columnKey as TSortableColumnKey)
    ? {
        sort: {
          columnIndex: columnKeys.indexOf(columnKey),
          sortBy: {
            index: activeSort
              ? columnKeys.indexOf(activeSort.columnKey as TSortableColumnKey)
              : undefined,
            direction: activeSort?.direction,
          },
          onSort: (event, index, direction) => {
            setActiveSort({
              columnKey: columnKeys[index] as TSortableColumnKey,
              direction,
            });
          },
        },
      }
    : {},
});
