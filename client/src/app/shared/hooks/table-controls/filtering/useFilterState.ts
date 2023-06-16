import * as React from "react";
import { useSessionStorage } from "@migtools/lib-ui";
import {
  FilterCategory,
  FilterValue,
  IFilterValues,
} from "@app/shared/components/FilterToolbar";
import { useUrlParams } from "../../useUrlParams";
import { objectKeys } from "@app/utils/utils";
import { IExtraArgsForURLParamHooks } from "../types";

export interface IFilterState<TFilterCategoryKey extends string> {
  filterValues: IFilterValues<TFilterCategoryKey>;
  setFilterValues: (values: IFilterValues<TFilterCategoryKey>) => void;
}

export interface IFilterStateArgs<TItem, TFilterCategoryKey extends string> {
  filterStorageKey?: string;
  filterCategories?: FilterCategory<TItem, TFilterCategoryKey>[];
}

// When setting filter values, always sort the keys by the order they appear in filterCategories
// in order to retain order when carrying filters from page to page.
const sortAndSetFilterValues = <TItem, TFilterCategoryKey extends string>(
  newFilterValues: IFilterValues<TFilterCategoryKey>,
  baseSetFilterValues: (values: IFilterValues<TFilterCategoryKey>) => void,
  filterCategories?: FilterCategory<TItem, TFilterCategoryKey>[]
) => {
  if (!filterCategories) return;
  const newSortedValues: IFilterValues<TFilterCategoryKey> = {};
  filterCategories.forEach((category) => {
    if (newFilterValues[category.key]) {
      newSortedValues[category.key] = newFilterValues[category.key];
    }
  });
  baseSetFilterValues(newSortedValues);
};

export const useFilterState = <TItem, TFilterCategoryKey extends string>({
  filterStorageKey,
  filterCategories,
}: IFilterStateArgs<
  TItem,
  TFilterCategoryKey
>): IFilterState<TFilterCategoryKey> => {
  const state = React.useState<IFilterValues<TFilterCategoryKey>>({});
  const storage = useSessionStorage<IFilterValues<TFilterCategoryKey>>(
    filterStorageKey || "",
    {}
  );
  const [filterValues, baseSetFilterValues] = filterStorageKey
    ? storage
    : state;
  return {
    filterValues,
    setFilterValues: (values) =>
      sortAndSetFilterValues(values, baseSetFilterValues, filterCategories),
  };
};

export const serializeFilterUrlParams = <TFilterCategoryKey extends string>(
  filterValues: IFilterValues<TFilterCategoryKey>
): { filters?: string | null } => {
  // If a filter value is empty/cleared, don't put it in the object in URL params
  const trimmedFilterValues = { ...filterValues };
  objectKeys(trimmedFilterValues).forEach((filterCategoryKey) => {
    if (
      !trimmedFilterValues[filterCategoryKey] ||
      trimmedFilterValues[filterCategoryKey]?.length === 0
    ) {
      delete trimmedFilterValues[filterCategoryKey];
    }
  });
  return {
    filters:
      objectKeys(trimmedFilterValues).length > 0
        ? JSON.stringify(trimmedFilterValues)
        : null, // If there are no filters, remove the filters param from the URL entirely.
  };
};

export const deserializeFilterUrlParams = <
  TFilterCategoryKey extends string
>(serializedParams: {
  filters?: string | null;
}): Partial<Record<TFilterCategoryKey, FilterValue>> => {
  try {
    return JSON.parse(serializedParams.filters || "{}");
  } catch (e) {
    return {};
  }
};

export const useFilterUrlParams = <
  TItem,
  TFilterCategoryKey extends string,
  TURLParamKeyPrefix extends string = string
>({
  urlParamKeyPrefix,
  filterCategories,
}: IFilterStateArgs<TItem, TFilterCategoryKey> &
  IExtraArgsForURLParamHooks<TURLParamKeyPrefix> = {}): IFilterState<TFilterCategoryKey> => {
  const [filterValues, baseSetFilterValues] = useUrlParams({
    keyPrefix: urlParamKeyPrefix,
    keys: ["filters"],
    defaultValue: {} as IFilterValues<TFilterCategoryKey>,
    serialize: serializeFilterUrlParams,
    deserialize: deserializeFilterUrlParams,
  });
  return {
    filterValues,
    setFilterValues: (values) =>
      sortAndSetFilterValues(values, baseSetFilterValues, filterCategories),
  };
};
