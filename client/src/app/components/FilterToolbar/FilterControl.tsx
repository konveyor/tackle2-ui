import * as React from "react";

import {
  FilterCategory,
  FilterValue,
  FilterType,
  ISelectFilterCategory,
  ISearchFilterCategory,
  IMultiselectFilterCategory,
} from "./FilterToolbar";
import { SelectFilterControl } from "./SelectFilterControl";
import { SearchFilterControl } from "./SearchFilterControl";
import { MultiselectFilterControl } from "./MultiselectFilterControl";
import { DateRangeFilter } from "./DateRangeFilter";

export interface IFilterControlProps<TItem, TFilterCategoryKey extends string> {
  category: FilterCategory<TItem, TFilterCategoryKey>;
  filterValue: FilterValue;
  setFilterValue: (newValue: FilterValue) => void;
  showToolbarItem: boolean;
  isDisabled?: boolean;
}

export const FilterControl = <TItem, TFilterCategoryKey extends string>({
  category,
  ...props
}: IFilterControlProps<TItem, TFilterCategoryKey>): JSX.Element | null => {
  if (category.type === FilterType.select) {
    return (
      <SelectFilterControl
        isScrollable
        category={category as ISelectFilterCategory<TItem, TFilterCategoryKey>}
        {...props}
      />
    );
  }
  if (
    category.type === FilterType.search ||
    category.type === FilterType.numsearch
  ) {
    return (
      <SearchFilterControl
        category={category as ISearchFilterCategory<TItem, TFilterCategoryKey>}
        isNumeric={category.type === FilterType.numsearch}
        {...props}
      />
    );
  }
  if (category.type === FilterType.multiselect) {
    return (
      <MultiselectFilterControl
        isScrollable
        category={
          category as IMultiselectFilterCategory<TItem, TFilterCategoryKey>
        }
        {...props}
      />
    );
  }
  if (category.type === FilterType.dateRange) {
    return <DateRangeFilter category={category} {...props} />;
  }
  return null;
};
