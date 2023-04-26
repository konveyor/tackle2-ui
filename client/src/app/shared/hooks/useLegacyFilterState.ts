import * as React from "react";
import { useSessionStorage } from "@migtools/lib-ui";
import {
  IFilterValues,
  FilterCategory,
  IMultiselectFilterCategory,
} from "../components/FilterToolbar";

// NOTE: This was refactored to return generic state data and decouple the client-side-filtering piece to another helper function.
//       See useFilterState for the new version, which should probably be used instead of this everywhere eventually.
//       See useLocalFilterDerivedState and getFilterProps for the pieces that were removed here.

export interface IFilterStateHook<T> {
  filterValues: IFilterValues;
  setFilterValues: (values: IFilterValues) => void;
  filteredItems: T[];
}

// TODO refactor this to take an object of args for consistency with the other table state hooks

export const useLegacyFilterState = <T>(
  items: T[],
  filterCategories: FilterCategory<T>[],
  storageKey?: string
): IFilterStateHook<T> => {
  const state = React.useState<IFilterValues>({});
  const storage = useSessionStorage<IFilterValues>(storageKey || "", {});
  const [filterValues, setFilterValues] = storageKey ? storage : state;

  const filteredItems = items.filter((item) =>
    Object.keys(filterValues).every((categoryKey) => {
      const values = filterValues[categoryKey];
      if (!values || values.length === 0) return true;
      const filterCategory = filterCategories.find(
        (category) => category.key === categoryKey
      );
      let itemValue = (item as any)[categoryKey];
      if (filterCategory?.getItemValue) {
        itemValue = filterCategory.getItemValue(item);
      }
      const logicOperator =
        (filterCategory &&
          (filterCategory as IMultiselectFilterCategory<T>).logicOperator) ||
        "AND";
      return values[logicOperator === "AND" ? "every" : "some"](
        (filterValue) => {
          if (!itemValue) return false;
          const lowerCaseItemValue = String(itemValue).toLowerCase();
          const lowerCaseFilterValue = String(filterValue).toLowerCase();
          return lowerCaseItemValue.indexOf(lowerCaseFilterValue) !== -1;
        }
      );
    })
  );
  return { filterValues, setFilterValues, filteredItems };
};
