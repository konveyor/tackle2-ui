import {
  FilterCategory,
  IFilterToolbarProps,
} from "@app/components/FilterToolbar";
import { IFilterState } from "./useFilterState";

export interface IFilterPropHelpersArgs<
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
}: IFilterPropHelpersArgs<TItem, TFilterCategoryKey>): IFilterToolbarProps<
  TItem,
  TFilterCategoryKey
> => ({
  filterCategories,
  filterValues,
  setFilterValues,
});
