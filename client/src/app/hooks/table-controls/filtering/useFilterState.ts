import { FilterCategory, IFilterValues } from "@app/components/FilterToolbar";
import { IFeaturePersistenceArgs } from "../types";
import { usePersistentState } from "@app/hooks/usePersistentState";
import { serializeFilterUrlParams } from "./helpers";
import { deserializeFilterUrlParams } from "./helpers";

export interface IFilterState<TFilterCategoryKey extends string> {
  filterValues: IFilterValues<TFilterCategoryKey>;
  setFilterValues: (values: IFilterValues<TFilterCategoryKey>) => void;
}

export type IFilterStateEnabledArgs<
  TItem,
  TFilterCategoryKey extends string,
> = {
  filterCategories: FilterCategory<TItem, TFilterCategoryKey>[];
};

export type IFilterStateArgs<TItem, TFilterCategoryKey extends string> =
  | ({
      isFilterEnabled: true;
    } & IFilterStateEnabledArgs<TItem, TFilterCategoryKey>)
  | { isFilterEnabled?: false };

export const useFilterState = <
  TItem,
  TFilterCategoryKey extends string,
  TPersistenceKeyPrefix extends string = string,
>(
  args: IFilterStateArgs<TItem, TFilterCategoryKey> &
    IFeaturePersistenceArgs<TPersistenceKeyPrefix>
): IFilterState<TFilterCategoryKey> => {
  const { isFilterEnabled, persistTo = "state", persistenceKeyPrefix } = args;

  // We won't need to pass the latter two type params here if TS adds support for partial inference.
  // See https://github.com/konveyor/tackle2-ui/issues/1456
  const [filterValues, setFilterValues] = usePersistentState<
    IFilterValues<TFilterCategoryKey>,
    TPersistenceKeyPrefix,
    "filters"
  >({
    isEnabled: isFilterEnabled,
    defaultValue: {},
    persistenceKeyPrefix,
    // Note: For the discriminated union here to work without TypeScript getting confused
    //       (e.g. require the urlParams-specific options when persistTo === "urlParams"),
    //       we need to pass persistTo inside each type-narrowed options object instead of outside the ternary.
    ...(persistTo === "urlParams"
      ? {
          persistTo,
          keys: ["filters"],
          serialize: serializeFilterUrlParams,
          deserialize: deserializeFilterUrlParams,
        }
      : persistTo === "localStorage" || persistTo === "sessionStorage"
      ? { persistTo, key: "filters" }
      : { persistTo }),
  });
  return { filterValues, setFilterValues };
};
