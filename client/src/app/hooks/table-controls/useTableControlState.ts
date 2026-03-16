import { useActiveItemState } from "./active-item";
import { useColumnState } from "./column/useColumnState";
import { useExpansionState } from "./expansion";
import { useFilterState } from "./filtering";
import { usePaginationState } from "./pagination";
import { useSortState } from "./sorting";
import {
  IFeaturePersistenceArgs,
  ITableControlState,
  ITablePersistenceArgs,
  IUseTableControlStateArgs,
  TableFeature,
} from "./types";

const getPersistTo = ({
  feature,
  persistTo,
}: {
  feature: TableFeature;
  persistTo: ITablePersistenceArgs["persistTo"];
}): {
  persistTo: IFeaturePersistenceArgs["persistTo"];
} => ({
  persistTo:
    !persistTo || typeof persistTo === "string"
      ? persistTo
      : persistTo[feature],
});

/**
 * Manage a table's features.  Each feature's state, the "source of truth", is provided here.
 *
 * The control state is used by `useTableControlProps()` to generate property helpers for
 * the table components.
 *
 * - State can be persisted in one or more configurable storage targets, either the same for the entire table or different targets per feature.
 * - "source of truth" (persisted) state and "derived state" are kept separate to prevent out-of-sync duplicated state.
 * - If you are using client-side filtering/sorting/pagination, call this via the shorthand hook `useLocalTableControls()`.
 * - If you are using server-side filtering/sorting/pagination, call this first before fetching your API data and then calling `useTableControlProps()`.
 */
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
): ITableControlState<
  TItem,
  TColumnKey,
  TSortableColumnKey,
  TFilterCategoryKey,
  TPersistenceKeyPrefix
> => {
  const filterState = useFilterState<
    TItem,
    TFilterCategoryKey,
    TPersistenceKeyPrefix
  >({
    ...args,
    ...getPersistTo({ feature: "filter", persistTo: args.persistTo }),
  });
  const sortState = useSortState<TSortableColumnKey, TPersistenceKeyPrefix>({
    ...args,
    ...getPersistTo({ feature: "sort", persistTo: args.persistTo }),
  });
  const paginationState = usePaginationState<TPersistenceKeyPrefix>({
    ...args,
    ...getPersistTo({ persistTo: args.persistTo, feature: "pagination" }),
  });
  const expansionState = useExpansionState<TColumnKey, TPersistenceKeyPrefix>({
    ...args,
    ...getPersistTo({ persistTo: args.persistTo, feature: "expansion" }),
  });
  const activeItemState = useActiveItemState<TPersistenceKeyPrefix>({
    ...args,
    ...getPersistTo({ persistTo: args.persistTo, feature: "activeItem" }),
  });

  const { columnNames, tableName, initialColumns } = args;
  const columnState = useColumnState<TColumnKey>({
    columnsKey: tableName,
    initialColumns,
    supportedColumns: columnNames,
  });

  return {
    ...args,
    filterState,
    sortState,
    paginationState,
    expansionState,
    activeItemState,
    columnState,
  };
};
