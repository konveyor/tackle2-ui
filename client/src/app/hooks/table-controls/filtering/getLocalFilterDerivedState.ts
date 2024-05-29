import {
  FilterCategory,
  FilterValue,
  getFilterLogicOperator,
} from "@app/components/FilterToolbar";
import { IFilterState } from "./useFilterState";

/**
 * Args for getLocalFilterDerivedState
 * - Partially satisfied by the object returned by useTableControlState (ITableControlState)
 * - Makes up part of the arguments object taken by getLocalTableControlDerivedState (ITableControlLocalDerivedStateArgs)
 * @see ITableControlState
 * @see ITableControlLocalDerivedStateArgs
 */
export interface ILocalFilterDerivedStateArgs<
  TItem,
  TFilterCategoryKey extends string,
> {
  /**
   * The API data items before filtering
   */
  items: TItem[];
  /**
   * Definitions of the filters to be used (must include `getItemValue` functions for each category when performing filtering locally)
   */
  filterCategories?: FilterCategory<TItem, TFilterCategoryKey>[];
  /**
   * The "source of truth" state for the filter feature (returned by useFilterState)
   */
  filterState: IFilterState<TFilterCategoryKey>;
}

/**
 * Given the "source of truth" state for the filter feature and additional arguments, returns "derived state" values and convenience functions.
 * - For local/client-computed tables only. Performs the actual filtering logic, which is done on the server for server-computed tables.
 * - "source of truth" (persisted) state and "derived state" are kept separate to prevent out-of-sync duplicated state.
 */
export const getLocalFilterDerivedState = <
  TItem,
  TFilterCategoryKey extends string,
>({
  items,
  filterCategories = [],
  filterState: { filterValues },
}: ILocalFilterDerivedStateArgs<TItem, TFilterCategoryKey>) => {
  const filteredItems = items.filter((item) =>
    Object.entries<FilterValue>(filterValues).every(([filterKey, values]) => {
      if (!values || values.length === 0) return true;
      const filterCategory = filterCategories.find(
        (category) => category.categoryKey === filterKey
      );
      const defaultMatcher = (filterValue: string, item: TItem) =>
        legacyMatcher(
          filterValue,
          filterCategory?.getItemValue?.(item) ?? (item as any)[filterKey]
        );
      const matcher = filterCategory?.matcher ?? defaultMatcher;
      const logicOperator =
        getFilterLogicOperator(filterCategory) === "AND" ? "every" : "some";
      return values[logicOperator]((filterValue) => matcher(filterValue, item));
    })
  );

  return { filteredItems };
};

/**
 *
 * @returns false for any falsy value (regardless of the filter value), true if (coerced to string) lowercased value contains lowercased filter value.
 */
const legacyMatcher = (filterValue: string, value: any) => {
  if (!value) return false;
  const lowerCaseItemValue = String(value).toLowerCase();
  const lowerCaseFilterValue = String(filterValue).toLowerCase();
  return lowerCaseItemValue.indexOf(lowerCaseFilterValue) !== -1;
};
