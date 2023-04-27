import * as React from "react";
import { useSessionStorage } from "@migtools/lib-ui";
import {
  FilterCategory,
  IFilterValues,
} from "@app/shared/components/FilterToolbar";
import { useUrlParams } from "../../useUrlParams";
import { objectKeys } from "@app/utils/utils";

export interface IFilterState<TFilterCategoryKey extends string> {
  filterValues: IFilterValues<TFilterCategoryKey>;
  setFilterValues: (values: IFilterValues<TFilterCategoryKey>) => void;
}

export interface IFilterStateArgs<TItem, TFilterCategoryKey extends string> {
  filterStorageKey?: string;
  filterCategories?: FilterCategory<TItem, TFilterCategoryKey>[];
}

export const useFilterState = <TItem, TFilterCategoryKey extends string>({
  filterStorageKey,
}: IFilterStateArgs<
  TItem,
  TFilterCategoryKey
>): IFilterState<TFilterCategoryKey> => {
  const state = React.useState<IFilterValues<TFilterCategoryKey>>({});
  const storage = useSessionStorage<IFilterValues<TFilterCategoryKey>>(
    filterStorageKey || "",
    {}
  );
  const [filterValues, setFilterValues] = filterStorageKey ? storage : state;
  return { filterValues, setFilterValues };
};

export const useFilterUrlParams = <
  TFilterCategoryKey extends string
>(): IFilterState<TFilterCategoryKey> => {
  const [filterValues, setFilterValues] = useUrlParams<
    "filters",
    IFilterValues<TFilterCategoryKey>
  >({
    keys: ["filters"],
    defaultValue: {},
    serialize: (filterValues) => {
      // If a filter value is empty/cleared, don't put it in URL params
      const trimmedFilterValues = { ...filterValues };
      objectKeys(trimmedFilterValues).forEach((filterCategoryKey) => {
        if (
          !trimmedFilterValues[filterCategoryKey] ||
          trimmedFilterValues[filterCategoryKey]?.length === 0
        ) {
          delete trimmedFilterValues[filterCategoryKey];
        }
      });
      return { filters: JSON.stringify(trimmedFilterValues) };
    },
    deserialize: (urlParams) => {
      try {
        return JSON.parse(urlParams.filters || "{}");
      } catch (e) {
        return {};
      }
    },
  });
  return { filterValues, setFilterValues };
};
