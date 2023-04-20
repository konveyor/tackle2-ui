// Hub filter/sort/pagination utils
// TODO these could use some unit tests!

import { HubFilter, HubRequestParams } from "@app/api/models";

export const wrapInQuotesAndEscape = (str: string): string =>
  `"${str.replace('"', '\\"')}"`;

export const serializeHubFilter = (filter: HubFilter): string => {
  const { field, operator, value } = filter;
  const joinedValue =
    typeof value === "string"
      ? wrapInQuotesAndEscape(value)
      : `(${value.list
          .map(wrapInQuotesAndEscape)
          .join(value.operator === "or" ? "|" : ",")})`;
  return `${field}${operator}${joinedValue}`;
};

export const deserializeHubFilter = (serializedFilter: string): HubFilter => {
  return { field: "", operator: "=", value: "" }; // TODO
};

export const serializeHubRequestParams = (
  params: HubRequestParams
): URLSearchParams => {
  const urlParams = new URLSearchParams();
  if (params.filters) {
    params.filters.forEach((filter) =>
      urlParams.append("filter", serializeHubFilter(filter))
    );
  }
  if (params.sort) {
    const { field, direction } = params.sort;
    urlParams.append("sort", `${direction}:${field}`);
  }
  if (params.page) {
    const { pageNum, itemsPerPage } = params.page;
    urlParams.append("limit", String(itemsPerPage));
    urlParams.append("offset", String((pageNum - 1) * itemsPerPage));
  }
  return urlParams;
};

export const deserializeHubRequestParams = (
  urlParams: URLSearchParams
): HubRequestParams => {
  const params: HubRequestParams = {};
  const serializedFilters = urlParams.getAll("filter");
  if (serializedFilters.length > 0) {
    params.filters = serializedFilters.map(deserializeHubFilter);
  }
  const serializedSort = urlParams.get("sort");
  if (serializedSort) {
    let direction: string, field: string;
    if (serializedSort.includes(":")) {
      [direction, field] = serializedSort.split(":");
    } else {
      direction = "asc";
      field = serializedSort;
    }
    params.sort = {
      field,
      direction: direction.startsWith("d") ? "desc" : "asc",
    };
  }
  const limit = urlParams.get("limit");
  const offset = urlParams.get("offset");
  if (limit) {
    params.page = {
      pageNum: offset ? Number(offset) / Number(limit) + 1 : 1,
      itemsPerPage: Number(limit),
    };
  }
  return params;
};
