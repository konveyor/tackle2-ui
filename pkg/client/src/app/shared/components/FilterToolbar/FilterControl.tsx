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

export interface IFilterControlProps<T> {
  category: FilterCategory<T>;
  filterValue: FilterValue;
  setFilterValue: (newValue: FilterValue) => void;
  showToolbarItem: boolean;
}

export const FilterControl = <T,>({
  category,
  ...props
}: React.PropsWithChildren<IFilterControlProps<T>>): JSX.Element | null => {
  if (category.type === FilterType.select) {
    return (
      <SelectFilterControl
        category={category as ISelectFilterCategory<T>}
        {...props}
      />
    );
  }
  if (category.type === FilterType.search) {
    return (
      <SearchFilterControl
        category={category as ISearchFilterCategory<T>}
        {...props}
      />
    );
  }
  if (category.type === FilterType.multiselect) {
    console.log("props", props);
    return (
      <MultiselectFilterControl
        category={category as IMultiselectFilterCategory<T>}
        {...props}
      />
    );
  }
  return null;
};
