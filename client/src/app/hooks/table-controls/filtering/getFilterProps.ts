import {
  FilterCategory,
  IFilterToolbarProps,
} from "@app/components/FilterToolbar";
import { IFilterState } from "./useFilterState";

export type IFilterPropsEnabledArgs<
  TItem,
  TFilterCategoryKey extends string,
> = {
  filterCategories: FilterCategory<TItem, TFilterCategoryKey>[];
};

export type IFilterPropsArgs<TItem, TFilterCategoryKey extends string> = {
  filterState: IFilterState<TFilterCategoryKey>;
} & (
  | ({ isFilterEnabled: true } & IFilterPropsEnabledArgs<
      TItem,
      TFilterCategoryKey
    >)
  | { isFilterEnabled?: false }
);

export const getFilterProps = <TItem, TFilterCategoryKey extends string>(
  args: IFilterPropsArgs<TItem, TFilterCategoryKey>
): IFilterToolbarProps<TItem, TFilterCategoryKey> => {
  const { isFilterEnabled } = args;
  return {
    filterCategories: (isFilterEnabled && args.filterCategories) || [],
    filterValues: (isFilterEnabled && args.filterState.filterValues) || {},
    setFilterValues:
      (isFilterEnabled && args.filterState.setFilterValues) || (() => {}),
  };
};
