import { IFilterValues, FilterCategory } from "../components/FilterToolbar";
import {
  getLocalFilterDerivedState,
  useFilterState,
} from "./table-controls/filtering";

// NOTE: This was refactored to return generic state data and decouple the client-side-filtering piece to another helper function.
//       See useFilterState for the new version, which should probably be used instead of this everywhere eventually.
//       See useLocalFilterDerivedState and getFilterProps for the pieces that were removed here.

export interface IFilterStateHook<TItem, TFilterCategoryKey extends string> {
  filterValues: IFilterValues<TFilterCategoryKey>;
  setFilterValues: (values: IFilterValues<TFilterCategoryKey>) => void;
  filteredItems: TItem[];
}

export const useLegacyFilterState = <TItem, TFilterCategoryKey extends string>(
  items: TItem[],
  filterCategories: FilterCategory<TItem, TFilterCategoryKey>[],
  filterStorageKey?: string
): IFilterStateHook<TItem, TFilterCategoryKey> => {
  const { filterValues, setFilterValues } = useFilterState({
    filterStorageKey,
  });
  const { filteredItems } = getLocalFilterDerivedState({
    items,
    filterCategories,
    filterState: { filterValues, setFilterValues },
  });
  return { filterValues, setFilterValues, filteredItems };
};
