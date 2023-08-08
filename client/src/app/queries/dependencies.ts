import { useQuery } from "@tanstack/react-query";
import {
  AnalysisAppDependency,
  AnalysisDependency,
  HubPaginatedResult,
  HubRequestParams,
} from "@app/api/models";
import { getAppDependencies, getDependencies } from "@app/api/rest";
import { serializeRequestParamsForHub } from "@app/hooks/table-controls/getHubRequestParams";

export interface IDependenciesFetchState {
  result: HubPaginatedResult<AnalysisDependency>;
  isFetching: boolean;
  fetchError: unknown;
  refetch: () => void;
}
export interface IAppDependenciesFetchState {
  result: HubPaginatedResult<AnalysisAppDependency>;
  isFetching: boolean;
  fetchError: unknown;
  refetch: () => void;
}

export const DependenciesQueryKey = "dependencies";
export const AppDependenciesQueryKey = "appdependencies";

export const useFetchDependencies = (
  params: HubRequestParams = {}
): IDependenciesFetchState => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      DependenciesQueryKey,
      serializeRequestParamsForHub(params).toString(),
    ],
    queryFn: async () => await getDependencies(params),
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

export const useFetchAppDependencies = (
  params: HubRequestParams = {}
): IAppDependenciesFetchState => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      AppDependenciesQueryKey,
      serializeRequestParamsForHub(params).toString(),
    ],
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
