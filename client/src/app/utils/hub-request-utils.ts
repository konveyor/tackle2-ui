// Hub filter/sort/pagination utils
// TODO these could use some unit tests!

import { HubFilter, HubRequestParams } from "@app/api/models";
import { IPaginationState } from "@app/shared/hooks/use-table-controls/pagination";
import { ISortState } from "@app/shared/hooks/use-table-controls/sorting";

// TODO we either need to make the FilterToolbar compatible with the HubFilter format (or a better name?)
//      or we need to use a plain Record<string, string | string[]> as the filter format and then figure out
//      how to have column-specific serializers (options like whether to use AND or OR will differ by column)

export const wrapInQuotesAndEscape = (str: string): string =>
  `"${str.replace('"', '\\"')}"`;

export const serializeFilterForHub = (filter: HubFilter): string => {
  const { field, operator, value } = filter;
  const joinedValue =
    typeof value === "string"
      ? wrapInQuotesAndEscape(value)
      : `(${value.list
          .map(wrapInQuotesAndEscape)
          .join(value.operator === "or" ? "|" : ",")})`;
  return `${field}${operator}${joinedValue}`;
};

export const serializeRequestParamsForHub = (
  params: HubRequestParams
): URLSearchParams => {
  const hubUrlParams = new URLSearchParams();
  if (params.filters) {
    params.filters.forEach((filter) =>
      hubUrlParams.append("filter", serializeFilterForHub(filter))
    );
  }
  if (params.sort) {
    const { field, direction } = params.sort;
    hubUrlParams.append("sort", `${direction}:${field}`);
  }
  if (params.page) {
    const { pageNumber, itemsPerPage } = params.page;
    hubUrlParams.append("limit", String(itemsPerPage));
    hubUrlParams.append("offset", String((pageNumber - 1) * itemsPerPage));
  }
  return hubUrlParams;
};

export interface IGetHubRequestParamsArgs<TSortableColumnKey extends string> {
  sortState: ISortState<TSortableColumnKey>;
  paginationState: IPaginationState;
  hubFieldKeys: Record<TSortableColumnKey, string>; // Include filter
}

export const getHubRequestParams = <TSortableColumnKey extends string>({
  sortState,
  paginationState,
  hubFieldKeys,
}: IGetHubRequestParamsArgs<TSortableColumnKey>): HubRequestParams => {
  const params: HubRequestParams = {};
  // TODO filters?
  if (sortState.activeSort) {
    params.sort = {
      field: hubFieldKeys[sortState.activeSort.columnKey],
      direction: sortState.activeSort.direction,
    };
  }
  params.page = {
    pageNumber: paginationState.pageNumber,
    itemsPerPage: paginationState.itemsPerPage,
  };
  return params;
};
