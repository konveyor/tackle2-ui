import * as React from "react";
import { useSessionStorage } from "@migtools/lib-ui";
import {
  IFilterValues,
  FilterCategory,
  IMultiselectFilterCategory,
} from "../components/FilterToolbar";
import { objectKeys } from "@app/utils/utils";

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
  storageKey?: string
): IFilterStateHook<TItem, TFilterCategoryKey> => {
  const state = React.useState<IFilterValues<TFilterCategoryKey>>({});
  const storage = useSessionStorage<IFilterValues<TFilterCategoryKey>>(
    storageKey || "",
    {}
  );
  const [filterValues, setFilterValues] = storageKey ? storage : state;

  const filteredItems = items.filter((item) =>
    objectKeys(filterValues).every((categoryKey) => {
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
          (
            filterCategory as IMultiselectFilterCategory<
              TItem,
              TFilterCategoryKey
            >
          ).logicOperator) ||
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
