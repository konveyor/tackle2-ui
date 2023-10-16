import {
  FilterCategory,
  IFilterToolbarProps,
} from "@app/components/FilterToolbar";
import { IFilterState } from "./useFilterState";

// Args that should be passed into useTableControlProps
export interface IFilterPropHelpersExternalArgs<
  TItem,
  TFilterCategoryKey extends string,
> {
  filterState: IFilterState<TFilterCategoryKey>;
  filterCategories?: FilterCategory<TItem, TFilterCategoryKey>[];
}

export const getFilterToolbarProps = <
  TItem,
  TFilterCategoryKey extends string,
>({
  filterState: { filterValues, setFilterValues },
  filterCategories = [],
}: IFilterPropHelpersExternalArgs<
  TItem,
  TFilterCategoryKey
>): IFilterToolbarProps<TItem, TFilterCategoryKey> => ({
  filterCategories,
  filterValues,
  setFilterValues,
});
