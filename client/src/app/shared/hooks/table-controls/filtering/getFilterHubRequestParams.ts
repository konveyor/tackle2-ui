import { HubFilter, HubRequestParams } from "@app/api/models";
import { objectKeys } from "@app/utils/utils";
import {
  FilterCategory,
  getFilterLogicOperator,
} from "@app/shared/components/FilterToolbar";
import { IFilterState } from "./useFilterState";

export interface IGetFilterHubRequestParamsArgs<
  TItem,
  TFilterCategoryKey extends string = string
> {
  filterState?: IFilterState<TFilterCategoryKey>;
  filterCategories?: FilterCategory<TItem, TFilterCategoryKey>[];
}

export const getFilterHubRequestParams = <
  TItem,
  TFilterCategoryKey extends string = string
>({
  filterState,
  filterCategories,
}: IGetFilterHubRequestParamsArgs<
  TItem,
  TFilterCategoryKey
>): Partial<HubRequestParams> => {
  if (
    !filterState ||
    !filterCategories ||
    objectKeys(filterState.filterValues).length === 0
  ) {
    return {};
  }
  const { filterValues } = filterState;
  const params: HubRequestParams = { filters: [] };
  objectKeys(filterValues).forEach((categoryKey) => {
    const filterCategory = filterCategories?.find(
      (category) => category.key === categoryKey
    );
    const filterValue = filterValues[categoryKey];
    if (!filterCategory || !filterValue) return;
    // Note: If we need to support more of the logic operators in HubFilter in the future,
    //       we'll need to figure out how to express those on the FilterCategory objects
    //       and translate them here.
    if (filterCategory.type === "numsearch") {
      params.filters?.push({
        field: categoryKey,
        operator: "=",
        value: Number(filterValue[0]),
      });
    }
    if (filterCategory.type === "search") {
      params.filters?.push({
        field: categoryKey,
        operator: "~",
        value: `*${filterValue[0]}*`,
      });
    }
    if (filterCategory.type === "select") {
      params.filters?.push({
        field: categoryKey,
        operator: "=",
        value: filterValue[0],
      });
    }
    if (filterCategory.type === "multiselect") {
      params.filters?.push({
        field: categoryKey,
        operator: "=",
        value: {
          list: filterValue,
          operator: getFilterLogicOperator(filterCategory, "OR"),
        },
      });
    }
  });
  return params;
};

export const wrapInQuotesAndEscape = (str: string): string =>
  `"${str.replace('"', '\\"')}"`;

export const serializeFilterForHub = (filter: HubFilter): string => {
  const { field, operator, value } = filter;
  const joinedValue =
    typeof value === "string"
      ? wrapInQuotesAndEscape(value)
      : typeof value === "number"
      ? `"${value}"`
      : `(${value.list
          .map(wrapInQuotesAndEscape)
          .join(value.operator === "OR" ? "|" : ",")})`;
  return `${field}${operator}${joinedValue}`;
};

export const serializeFilterRequestParamsForHub = (
  deserializedParams: HubRequestParams,
  serializedParams: URLSearchParams
) => {
  const { filters } = deserializedParams;
  if (filters) {
    filters.forEach((filter) =>
      serializedParams.append("filter", serializeFilterForHub(filter))
    );
  }
};
