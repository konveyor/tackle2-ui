// Hub filter/sort/pagination utils
// TODO these could use some unit tests!

import { HubRequestParams } from "@app/api/models";
import {
  IGetFilterHubRequestParamsArgs,
  getFilterHubRequestParams,
  serializeFilterRequestParamsForHub,
} from "./filtering";
import {
  IGetSortHubRequestParamsArgs,
  getSortHubRequestParams,
  serializeSortRequestParamsForHub,
} from "./sorting";
import {
  IGetPaginationHubRequestParamsArgs,
  getPaginationHubRequestParams,
  serializePaginationRequestParamsForHub,
} from "./pagination";

export const getHubRequestParams = <
  TItem,
  TSortableColumnKey extends string,
  TFilterCategoryKey extends string = string
>(
  args: IGetFilterHubRequestParamsArgs<TItem, TFilterCategoryKey> &
    IGetSortHubRequestParamsArgs<TSortableColumnKey> &
    IGetPaginationHubRequestParamsArgs
): HubRequestParams => ({
  ...getFilterHubRequestParams(args),
  ...getSortHubRequestParams(args),
  ...getPaginationHubRequestParams(args),
});

export const serializeRequestParamsForHub = (
  deserializedParams: HubRequestParams
): URLSearchParams => {
  const serializedParams = new URLSearchParams();
  serializeFilterRequestParamsForHub(deserializedParams, serializedParams);
  serializeSortRequestParamsForHub(deserializedParams, serializedParams);
  serializePaginationRequestParamsForHub(deserializedParams, serializedParams);
  return serializedParams;
};
