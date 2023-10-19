import {
  FilterCategory,
  getFilterLogicOperator,
} from "@app/components/FilterToolbar";
import { objectKeys } from "@app/utils/utils";
import { IFilterState } from "./useFilterState";
import { DiscriminatedArgs } from "@app/utils/type-utils";

export type ILocalFilterDerivedStateArgs<
  TItem,
  TFilterCategoryKey extends string,
> = DiscriminatedArgs<
  "isFilterEnabled",
  {
    items: TItem[];
    filterCategories: FilterCategory<TItem, TFilterCategoryKey>[];
    filterState: IFilterState<TFilterCategoryKey>;
  }
>;

export type ILocalFilterDerivedState<TItem> = {
  filteredItems: TItem[];
};

export const getLocalFilterDerivedState = <
  TItem,
  TFilterCategoryKey extends string,
>(
  args: ILocalFilterDerivedStateArgs<TItem, TFilterCategoryKey>
) => {
  if (!args.isFilterEnabled) {
    return { filteredItems: [] };
  }

  const {
    items,
    filterCategories,
    filterState: { filterValues },
  } = args;

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
      const logicOperator = getFilterLogicOperator(filterCategory);
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
  return { filteredItems };
};
