import { HubRequestParams } from "@app/api/models";
import { ISortState } from "./useSortState";

export interface IGetSortHubRequestParamsArgs<
  TSortableColumnKey extends string
> {
  sortState?: ISortState<TSortableColumnKey>;
  hubSortFieldKeys?: Record<TSortableColumnKey, string>;
}

export const getSortHubRequestParams = <TSortableColumnKey extends string>({
  sortState,
  hubSortFieldKeys,
}: IGetSortHubRequestParamsArgs<TSortableColumnKey>): Partial<HubRequestParams> => {
  if (!sortState?.activeSort || !hubSortFieldKeys) return {};
  const { activeSort } = sortState;
  return {
    sort: {
      field: hubSortFieldKeys[activeSort.columnKey],
      direction: activeSort.direction,
    },
  };
};

export const serializeSortRequestParamsForHub = (
  deserializedParams: HubRequestParams,
  serializedParams: URLSearchParams
) => {
  const { sort } = deserializedParams;
  if (sort) {
    const { field, direction } = sort;
    serializedParams.append("sort", `${direction}:${field}`);
  }
};
