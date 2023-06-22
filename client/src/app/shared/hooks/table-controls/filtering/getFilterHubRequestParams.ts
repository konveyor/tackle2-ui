import { HubFilter, HubRequestParams } from "@app/api/models";
import { objectKeys } from "@app/utils/utils";
import {
  FilterCategory,
  getFilterLogicOperator,
} from "@app/shared/components/FilterToolbar";
import { IFilterState } from "./useFilterState";

// If we have multiple UI filters using the same hub field, we need to AND them and pass them to the hub as one filter.
const pushOrMergeFilter = (
  existingFilters: HubFilter[],
  newFilter: HubFilter
) => {
  const existingFilterIndex = existingFilters.findIndex(
    (f) => f.field === newFilter.field
  );
  const existingFilter =
    existingFilterIndex === -1 ? null : existingFilters[existingFilterIndex];
  // We only want to merge filters in specific conditions:
  if (
    existingFilter && // There is a filter to merge with
    existingFilter.operator === newFilter.operator && // It is using the same comparison operator as the new filter (=, ~)
    typeof newFilter.value !== "object" && // The new filter isn't already a list (nested lists are not supported)
    (typeof existingFilter.value !== "object" || // The existing filter isn't already a list, or...
      existingFilter.value.operator === "AND") // ...it is and it's an AND list (already merged once)
  ) {
    const mergedFilter: HubFilter =
      typeof existingFilter.value === "object"
        ? {
            ...existingFilter,
            value: {
              ...existingFilter.value,
              list: [...existingFilter.value.list, newFilter.value],
            },
          }
        : {
            ...existingFilter,
            value: {
              list: [existingFilter.value, newFilter.value],
              operator: "AND",
            },
          };
    existingFilters[existingFilterIndex] = mergedFilter;
  } else {
    existingFilters.push(newFilter);
  }
};

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
  const filters: HubFilter[] = [];
  if (filterState) {
    const { filterValues } = filterState;
    objectKeys(filterValues).forEach((categoryKey) => {
      const filterCategory = filterCategories?.find(
        (category) => category.key === categoryKey
      );
      const filterValue = filterValues[categoryKey];
      if (!filterCategory || !filterValue) return;
      const serverFilterField = filterCategory.serverFilterField || categoryKey;
      const serverFilterValue =
        filterCategory.getServerFilterValue?.(filterValue) || filterValue;
      // Note: If we need to support more of the logic operators in HubFilter in the future,
      //       we'll need to figure out how to express those on the FilterCategory objects
      //       and translate them here.
      if (filterCategory.type === "numsearch") {
        pushOrMergeFilter(filters, {
          field: serverFilterField,
          operator: "=",
          value: Number(serverFilterValue[0]),
        });
      }
      if (filterCategory.type === "search") {
        pushOrMergeFilter(filters, {
          field: serverFilterField,
          operator: "~",
          value: serverFilterValue[0],
        });
      }
      if (filterCategory.type === "select") {
        pushOrMergeFilter(filters, {
          field: serverFilterField,
          operator: "=",
          value: serverFilterValue[0],
        });
      }
      if (filterCategory.type === "multiselect") {
        pushOrMergeFilter(filters, {
          field: serverFilterField,
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
    implicitFilters.forEach((filter) => filters.push(filter));
  }
  return { filters };
};

export const wrapInQuotesAndEscape = (value: string | number): string =>
  `"${String(value).replace('"', '\\"')}"`;

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
    serializedParams.append(
      "filter",
      filters.map(serializeFilterForHub).join(",")
    );
  }
};
