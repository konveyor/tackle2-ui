import { useQuery } from "@tanstack/react-query";
import {
  AnalysisAppDependency,
  AnalysisDependency,
  HubPaginatedResult,
  HubRequestParams,
  WithUiId,
} from "@app/api/models";
import { getAppDependencies, getDependencies } from "@app/api/rest";
import { useWithUiId } from "@app/utils/query-utils";

export const DependenciesQueryKey = "dependencies";
export const AppDependenciesQueryKey = "appDependencies";

export interface IFetchDependenciesState {
  result: HubPaginatedResult<WithUiId<AnalysisDependency>>;
  isFetching: boolean;
  fetchError: unknown;
  refetch: () => void;
}

export const useFetchDependencies = (
  params: HubRequestParams = {}
): IFetchDependenciesState => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [DependenciesQueryKey, params],
    queryFn: async () => await getDependencies(params),
    onError: (error) => console.log("error, ", error),
    keepPreviousData: true,
  });

  const withUiId = useWithUiId(data?.data, (d) => `${d.name}/${d.provider}`);
  return {
    result: {
      data: withUiId,
      total: data?.total ?? 0,
      params: data?.params ?? params,
    },
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export interface IFetchAppDependenciesState {
  result: HubPaginatedResult<AnalysisAppDependency>;
  isFetching: boolean;
  fetchError: unknown;
  refetch: () => void;
}

export const useFetchAppDependencies = (
  params: HubRequestParams = {}
): IFetchAppDependenciesState => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [AppDependenciesQueryKey, params],
    queryFn: async () => await getAppDependencies(params),
    onError: (error) => console.log("error, ", error),
    keepPreviousData: true,
  });
  return {
    result: data || { data: [], total: 0, params },
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};
