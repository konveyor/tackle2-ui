import { ThProps } from "@patternfly/react-table";
import { ISortState } from "./useSortState";

// Args that should be passed into useTableControlProps
export interface ISortPropHelpersExternalArgs<
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
> {
  sortState: ISortState<TSortableColumnKey>;
  sortableColumns?: TSortableColumnKey[];
}

// Additional args that come from logic inside useTableControlProps
export interface ISortPropHelpersInternalArgs<TColumnKey extends string> {
  columnKeys: TColumnKey[];
}

export const useSortPropHelpers = <
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
>(
  args: ISortPropHelpersExternalArgs<TColumnKey, TSortableColumnKey> &
    ISortPropHelpersInternalArgs<TColumnKey>
) => {
  const {
    sortState: { activeSort, setActiveSort },
    sortableColumns = [],
    columnKeys,
  } = args;

  const getSortThProps = ({
    columnKey,
  }: {
    columnKey: TSortableColumnKey;
  }): Pick<ThProps, "sort"> =>
    sortableColumns.includes(columnKey)
      ? {
          sort: {
            columnIndex: columnKeys.indexOf(columnKey),
            sortBy: {
              index: activeSort
                ? columnKeys.indexOf(activeSort.columnKey)
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
      : {};

  return { getSortThProps };
};
