import { FilterCategory, IFilterValues } from "@app/components/FilterToolbar";

import {
  getLocalFilterDerivedState,
  useFilterState,
} from "./table-controls/filtering";

/**
 * @deprecated The return value of useLegacyFilterState which predates table-controls/table-batteries and is deprecated.
 * @see useLegacyFilterState
 */
export interface IFilterStateHook<TItem, TFilterCategoryKey extends string> {
  filterValues: IFilterValues<TFilterCategoryKey>;
  setFilterValues: (values: IFilterValues<TFilterCategoryKey>) => void;
  filteredItems: TItem[];
}

/**
 * @deprecated This hook predates table-controls/table-batteries and still hasn't been refactored away from all of our tables.
 *   This deprecated hook now depends on the table-controls version but wraps it with an API compatible with the legacy usage.
 *   It was refactored to return generic state data and decouple the client-side-filtering piece to another helper function.
 *   See useFilterState in table-controls for the new version, which should probably be used instead of this everywhere eventually.
 *   See getLocalFilterDerivedState and useFilterPropHelpers for the pieces that were removed here.
 * @see useFilterState
 * @see getLocalFilterDerivedState
 * @see getFilterProps
 */
export const useLegacyFilterState = <TItem, TFilterCategoryKey extends string>(
  items: TItem[],
  filterCategories: FilterCategory<TItem, TFilterCategoryKey>[]
): IFilterStateHook<TItem, TFilterCategoryKey> => {
  const { filterValues, setFilterValues } = useFilterState({
    isFilterEnabled: true,
    filterCategories,
  });
  const { filteredItems } = getLocalFilterDerivedState({
    items,
    filterCategories,
    filterState: { filterValues, setFilterValues },
  });
  return { filterValues, setFilterValues, filteredItems };
};
