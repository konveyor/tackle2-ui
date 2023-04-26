import * as React from "react";
import { useSessionStorage } from "@migtools/lib-ui";
import { IFilterValues } from "@app/shared/components/FilterToolbar";
import { useUrlParams } from "../../useUrlParams";

export interface IFilterState<TFilterCategoryKey extends string> {
  filterValues: IFilterValues<TFilterCategoryKey>;
  setFilterValues: (values: IFilterValues<TFilterCategoryKey>) => void;
}

export interface IFilterStateArgs {
  filterStorageKey?: string;
}

export const useFilterState = <TFilterCategoryKey extends string>({
  filterStorageKey,
}: IFilterStateArgs): IFilterState<TFilterCategoryKey> => {
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
    serialize: (filterValues) => ({ filters: JSON.stringify(filterValues) }),
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
