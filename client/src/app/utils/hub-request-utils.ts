// Hub filter/sort/pagination utils
// TODO these could use some unit tests!

import { HubFilter, HubRequestParams } from "@app/api/models";

// Filter/sort/pagination params come in 3 forms:
// - The HubRequestParams object we use in business logic
// - The URL-encoded version we store in our UI URL as state (can be whatever we want for convenience)
// - The URL-encoded version we pass to the hub in API requests (requires a specific format)
// For now, we just JSON-stringify the filters and toss them in our URL so we don't have to write a
// parser for the hub's filter string format. We may want to make this more elegant in the future.

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

// TODO maybe separate the arguments here into one for filters, one for sort, one for pagination? combine?
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
    const { pageNum, itemsPerPage } = params.page;
    hubUrlParams.append("limit", String(itemsPerPage));
    hubUrlParams.append("offset", String((pageNum - 1) * itemsPerPage));
  }
  return hubUrlParams;
};

// TODO maybe have a separate helper to serialize params for each of filters/sort/page so we can put them in separate hooks?
// TODO can we merge multiple URLSearchParams objects? { ...Object.fromEntries(urlParams) }
export const serializeRequestParamsForUI = (
  params: HubRequestParams
): URLSearchParams => {
  const uiUrlParams = new URLSearchParams();
  if (params.filters) {
    uiUrlParams.append("filters", JSON.stringify(params.filters));
  }
  if (params.sort) {
    uiUrlParams.append("sortField", params.sort.field);
    uiUrlParams.append("sortDirection", params.sort.direction);
  }
  if (params.page) {
    uiUrlParams.append("itemsPerPage", String(params.page.itemsPerPage));
    uiUrlParams.append("pageNum", String(params.page.pageNum));
  }
  return uiUrlParams;
};

export const deserialzeRequestParamsForUI = (
  uiUrlParams: URLSearchParams
): HubRequestParams => {
  const params: HubRequestParams = {};
  const filtersJson = uiUrlParams.get("filters");
  if (filtersJson) {
    try {
      params.filters = JSON.parse(filtersJson) as HubFilter[];
    } catch (e) {
      console.error("Unable to parse filters from JSON: ", filtersJson);
    }
  }
  const sortField = uiUrlParams.get("sortField");
  const sortDirection = uiUrlParams.get("sortDirection");
  if (sortField && (sortDirection === "asc" || sortDirection === "desc")) {
    params.sort = {
      field: sortField,
      direction: sortDirection,
    };
  }
  const itemsPerPageStr = uiUrlParams.get("itemsPerPage");
  const pageNumStr = uiUrlParams.get("pageNum");
  if (itemsPerPageStr && pageNumStr) {
    params.page = {
      itemsPerPage: parseInt(itemsPerPageStr, 10),
      pageNum: parseInt(pageNumStr, 10),
    };
  }
  return params;
};
