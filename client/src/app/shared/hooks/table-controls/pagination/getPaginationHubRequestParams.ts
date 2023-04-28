import { HubRequestParams } from "@app/api/models";
import { IPaginationState } from "./usePaginationState";

export interface IGetPaginationHubRequestParamsArgs {
  paginationState?: IPaginationState;
}

export const getPaginationHubRequestParams = ({
  paginationState,
}: IGetPaginationHubRequestParamsArgs): Partial<HubRequestParams> => {
  if (!paginationState) return {};
  const { pageNumber, itemsPerPage } = paginationState;
  return { page: { pageNumber, itemsPerPage } };
};

export const serializePaginationRequestParamsForHub = (
  deserializedParams: HubRequestParams,
  serializedParams: URLSearchParams
) => {
  const { page } = deserializedParams;
  if (page) {
    const { pageNumber, itemsPerPage } = page;
    serializedParams.append("limit", String(itemsPerPage));
    serializedParams.append("offset", String((pageNumber - 1) * itemsPerPage));
  }
};
