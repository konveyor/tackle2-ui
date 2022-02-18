import * as React from "react";
import { IFilterValues, FilterCategory } from "../components/FilterToolbar";

export interface IFilterStateHook<T> {
  filterValues: IFilterValues;
  setFilterValues: (values: IFilterValues) => void;
  filteredItems: T[];
}

export const useFilterState = <T>(
  items: T[],
  filterCategories: FilterCategory<T>[]
): IFilterStateHook<T> => {
  const [filterValues, setFilterValues] = React.useState<IFilterValues>({});

  const filteredItems = items.filter((item) =>
    Object.keys(filterValues).every((categoryKey) => {
      const values = filterValues[categoryKey];
      if (!values || values.length === 0) return true;
      const filterCategory = filterCategories.find(
        (category) => category.key === categoryKey
      );
      let itemValue = item[categoryKey];
      if (filterCategory?.getItemValue) {
        itemValue = filterCategory.getItemValue(item);
      }
      return values.every((filterValue) => {
        if (!itemValue) return false;
        const lowerCaseItemValue = String(itemValue).toLowerCase();
        const lowerCaseFilterValue = String(filterValue).toLowerCase();
        return lowerCaseItemValue.indexOf(lowerCaseFilterValue) !== -1;
      });
    })
  );
  return { filterValues, setFilterValues, filteredItems };
};
