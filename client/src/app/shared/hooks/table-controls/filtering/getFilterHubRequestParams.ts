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
  implicitFilters?: HubFilter[];
}

export const getFilterHubRequestParams = <
  TItem,
  TFilterCategoryKey extends string = string
>({
  filterState,
  filterCategories,
  implicitFilters,
}: IGetFilterHubRequestParamsArgs<
  TItem,
  TFilterCategoryKey
>): Partial<HubRequestParams> => {
  if (
    !implicitFilters?.length &&
    (!filterState ||
      !filterCategories ||
      objectKeys(filterState.filterValues).length === 0)
  ) {
    return {};
  }
  console.log({ filterState });
  const params: HubRequestParams = { filters: [] };
  if (filterState) {
    const { filterValues } = filterState;
    objectKeys(filterValues).forEach((categoryKey) => {
      const filterCategory = filterCategories?.find(
        (category) => category.key === categoryKey
      );
      const filterValue = filterValues[categoryKey];
      if (!filterCategory || !filterValue) return;
      const serverFilterValue =
        filterCategory.getServerFilterValue?.(filterValue) || filterValue;
      // Note: If we need to support more of the logic operators in HubFilter in the future,
      //       we'll need to figure out how to express those on the FilterCategory objects
      //       and translate them here.
      if (filterCategory.type === "numsearch") {
        params.filters?.push({
          field: categoryKey,
          operator: "=",
          value: Number(serverFilterValue[0]),
        });
      }
      if (filterCategory.type === "search") {
        params.filters?.push({
          field: categoryKey,
          operator: "~",
          value: `*${serverFilterValue[0]}*`,
        });
      }
      if (filterCategory.type === "select") {
        params.filters?.push({
          field: categoryKey,
          operator: "=",
          value: serverFilterValue[0],
        });
      }
      if (filterCategory.type === "multiselect") {
        params.filters?.push({
          field: categoryKey,
          operator: "=",
          value: {
            list: serverFilterValue,
            operator: getFilterLogicOperator(filterCategory, "OR"),
          },
        });
      }
    });
  }
  if (implicitFilters) {
    implicitFilters.forEach((filter) => params.filters?.push(filter));
  }
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
