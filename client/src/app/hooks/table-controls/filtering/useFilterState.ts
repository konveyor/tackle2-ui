import { FilterCategory, IFilterValues } from "@app/components/FilterToolbar";
import { IPersistenceOptions } from "../types";
import {
  BaseUsePersistedStateOptions,
  usePersistedState,
} from "@app/hooks/usePersistedState";
import { serializeFilterUrlParams } from "./helpers";
import { deserializeFilterUrlParams } from "./helpers";

export interface IFilterState<TFilterCategoryKey extends string> {
  filterValues: IFilterValues<TFilterCategoryKey>;
  setFilterValues: (values: IFilterValues<TFilterCategoryKey>) => void;
}

export type IFilterStateArgs<
  TItem,
  TFilterCategoryKey extends string,
  TPersistenceKeyPrefix extends string = string,
> = {
  filterCategories?: FilterCategory<TItem, TFilterCategoryKey>[];
} & IPersistenceOptions<TPersistenceKeyPrefix>;

export const useFilterState = <
  TItem,
  TFilterCategoryKey extends string,
  TPersistenceKeyPrefix extends string = string,
>(
  args: IFilterStateArgs<TItem, TFilterCategoryKey, TPersistenceKeyPrefix>
): IFilterState<TFilterCategoryKey> => {
  const { persistTo = "state", persistenceKeyPrefix } = args;

  const baseOptions: BaseUsePersistedStateOptions<
    IFilterValues<TFilterCategoryKey>
  > = {
    defaultValue: {},
    persistenceKeyPrefix,
  };

  // Note: for the discriminated union here to work without TypeScript getting confused
  //       (e.g. require the urlParams-specific options when persistTo === "urlParams"),
  //       we need to pass persistTo inside each type-narrowed options object instead of outside the ternary.
  const [filterValues, setFilterValues] = usePersistedState(
    persistTo === "urlParams"
      ? {
          ...baseOptions,
          persistTo,
          keys: ["filters"],
          serialize: serializeFilterUrlParams,
          deserialize: deserializeFilterUrlParams,
        }
      : persistTo === "localStorage" || persistTo === "sessionStorage"
      ? {
          ...baseOptions,
          persistTo,
          key: "filters",
        }
      : {
          ...baseOptions,
          persistTo,
        }
  );
  return { filterValues, setFilterValues };
};
