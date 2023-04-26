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

export interface IFilterControlProps<TItem, TCategoryKey extends string> {
  category: FilterCategory<TItem, TCategoryKey>;
  filterValue: FilterValue;
  setFilterValue: (newValue: FilterValue) => void;
  showToolbarItem: boolean;
}

export const FilterControl = <TItem, TCategoryKey extends string>({
  category,
  ...props
}: React.PropsWithChildren<
  IFilterControlProps<TItem, TCategoryKey>
>): JSX.Element | null => {
  if (category.type === FilterType.select) {
    return (
      <SelectFilterControl
        category={category as ISelectFilterCategory<TItem, TCategoryKey>}
        {...props}
      />
    );
  }
  if (category.type === FilterType.search) {
    return (
      <SearchFilterControl
        category={category as ISearchFilterCategory<TItem, TCategoryKey>}
        {...props}
      />
    );
  }
  if (category.type === FilterType.multiselect) {
    return (
      <MultiselectFilterControl
        category={category as IMultiselectFilterCategory<TItem, TCategoryKey>}
        {...props}
      />
    );
  }
  return null;
};
