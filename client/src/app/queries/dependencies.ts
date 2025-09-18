import { useQuery } from "@tanstack/react-query";

import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import {
  AnalysisDependency,
  HubPaginatedResult,
  HubRequestParams,
  WithUiId,
} from "@app/api/models";
import { getAppDependencies, getDependencies } from "@app/api/rest";
import { useWithUiId } from "@app/utils/query-utils";

export const DependenciesQueryKey = "dependencies";
export const AppDependenciesQueryKey = "appDependencies";

export const useFetchDependencies = (
  params: HubRequestParams = {},
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const {
    data: dependencies,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [DependenciesQueryKey, params],
    queryFn: async () => await getDependencies(params),
    onError: (error) => console.log("error, ", error),
    keepPreviousData: true,
    refetchInterval,
  });

  const withUiId = useWithUiId(
    dependencies?.data,
    (d) => `${d.name}/${d.provider}`
  );
  return {
    result: {
      data: withUiId,
      total: dependencies?.total ?? 0,
      params: dependencies?.params ?? params,
    } as HubPaginatedResult<WithUiId<AnalysisDependency>>,
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useFetchAppDependencies = (
  params: HubRequestParams = {},
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [AppDependenciesQueryKey, params],
    queryFn: async () => await getAppDependencies(params),
    onError: (error) => console.log("error, ", error),
    keepPreviousData: true,
    refetchInterval,
  });
  return {
    result: data || { data: [], total: 0, params },
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};
