import { useQuery } from "@tanstack/react-query";
import {
  AnalysisCompositeIssue,
  HubPaginatedResult,
  HubRequestParams,
} from "@app/api/models";
import { getCompositeIssues } from "@app/api/rest";
import { serializeRequestParamsForHub } from "@app/shared/hooks/table-controls";

export interface IDependenciesFetchState {
  result: HubPaginatedResult<AnalysisCompositeIssue>;
  isFetching: boolean;
  fetchError: unknown;
  refetch: () => void;
}

export const IssuesQueryKey = "issues";

export const useFetchIssues = (
  params: HubRequestParams = {}
): IDependenciesFetchState => {
  const { data, isLoading, error, refetch } = useQuery(
    [IssuesQueryKey, serializeRequestParamsForHub(params).toString()],
    async () => await getCompositeIssues(params),
    {
      onError: (error) => console.log("error, ", error),
    }
  );
  return {
    result: data || { data: [], total: 0, params },
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};
