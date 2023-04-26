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

export interface IFilterStateHook<TItem, TCategoryKey extends string> {
  filterValues: IFilterValues<TCategoryKey>;
  setFilterValues: (values: IFilterValues<TCategoryKey>) => void;
  filteredItems: TItem[];
}

export const useLegacyFilterState = <TItem, TCategoryKey extends string>(
  items: TItem[],
  filterCategories: FilterCategory<TItem, TCategoryKey>[],
  storageKey?: string
): IFilterStateHook<TItem, TCategoryKey> => {
  const state = React.useState<IFilterValues<TCategoryKey>>({});
  const storage = useSessionStorage<IFilterValues<TCategoryKey>>(
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
          (filterCategory as IMultiselectFilterCategory<TItem, TCategoryKey>)
            .logicOperator) ||
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
