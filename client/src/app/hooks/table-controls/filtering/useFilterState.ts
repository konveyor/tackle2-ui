import { FilterCategory, IFilterValues } from "@app/components/FilterToolbar";
import { IPersistenceOptions } from "../types";
import {
  BaseUsePersistentStateOptions,
  usePersistentState,
} from "@app/hooks/usePersistentState";
import { serializeFilterUrlParams } from "./helpers";
import { deserializeFilterUrlParams } from "./helpers";

export interface IFilterState<TFilterCategoryKey extends string> {
  filterValues: IFilterValues<TFilterCategoryKey>;
  setFilterValues: (values: IFilterValues<TFilterCategoryKey>) => void;
}

export type IFilterStateArgs<TItem, TFilterCategoryKey extends string> = {
  filterCategories?: FilterCategory<TItem, TFilterCategoryKey>[];
};

export const useFilterState = <
  TItem,
  TFilterCategoryKey extends string,
  TPersistenceKeyPrefix extends string = string,
>(
  args: IFilterStateArgs<TItem, TFilterCategoryKey> &
    IPersistenceOptions<TPersistenceKeyPrefix>
): IFilterState<TFilterCategoryKey> => {
  const { persistTo = "state", persistenceKeyPrefix } = args;

  const baseStateOptions: BaseUsePersistentStateOptions<
    IFilterValues<TFilterCategoryKey>
  > = {
    defaultValue: {},
    persistenceKeyPrefix,
  };

  // Note: for the discriminated union here to work without TypeScript getting confused
  //       (e.g. require the urlParams-specific options when persistTo === "urlParams"),
  //       we need to pass persistTo inside each type-narrowed options object instead of outside the ternary.
  const [filterValues, setFilterValues] = usePersistentState(
    persistTo === "urlParams"
      ? {
          ...baseStateOptions,
          persistTo,
          keys: ["filters"],
          serialize: serializeFilterUrlParams,
          deserialize: deserializeFilterUrlParams,
        }
      : persistTo === "localStorage" || persistTo === "sessionStorage"
      ? { ...baseStateOptions, persistTo, key: "filters" }
      : { ...baseStateOptions, persistTo }
  );
  return { filterValues, setFilterValues };
};
