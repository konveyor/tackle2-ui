import {
  ITableControlState,
  IUseTableControlStateArgs,
  TableFeature,
} from "./types";
import { useFilterState } from "./filtering";
import { useSortState } from "./sorting";
import { usePaginationState } from "./pagination";
import { useActiveRowState } from "./active-row";
import { useExpansionState } from "./expansion";
import { getFeaturesEnabledWithFallbacks } from "./utils";

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
  const featuresEnabled = getFeaturesEnabledWithFallbacks(args.featuresEnabled);

  const getFeatureArgs = (feature: TableFeature) => ({
    isEnabled: featuresEnabled[feature],
    persistTo:
      !args.persistTo || typeof args.persistTo === "string"
        ? args.persistTo
        : args.persistTo[feature] || args.persistTo.default,
  });

  const filterState = useFilterState<
    TItem,
    TFilterCategoryKey,
    TPersistenceKeyPrefix
  >({
    ...args,
    ...getFeatureArgs("filter"),
  });
  const sortState = useSortState<TSortableColumnKey, TPersistenceKeyPrefix>({
    ...args,
    ...getFeatureArgs("sort"),
  });
  const paginationState = usePaginationState<TPersistenceKeyPrefix>({
    ...args,
    ...getFeatureArgs("pagination"),
  });
  const expansionState = useExpansionState<TColumnKey, TPersistenceKeyPrefix>({
    ...args,
    ...getFeatureArgs("expansion"),
  });
  const activeRowState = useActiveRowState<TPersistenceKeyPrefix>({
    ...args,
    ...getFeatureArgs("activeRow"),
  });
  // TODO include selectionState here when we move it from lib-ui
  return {
    ...args,
    filterState,
    sortState,
    paginationState,
    expansionState,
    activeRowState,
  };
};
