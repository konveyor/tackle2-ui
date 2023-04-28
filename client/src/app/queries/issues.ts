import { useQuery } from "@tanstack/react-query";
import {
  AnalysisCompositeIssue,
  HubPaginatedResult,
  HubRequestParams,
} from "@app/api/models";
import { getCompositeIssues } from "@app/api/rest";
import { serializeRequestParamsForHub } from "@app/shared/hooks/table-controls";

export interface IIssuesFetchState {
  result: HubPaginatedResult<AnalysisCompositeIssue>;
  isFetching: boolean;
  fetchError: unknown;
  refetch: () => void;
}

export const IssuesQueryKey = "issues";

export const useFetchIssues = (
  params: HubRequestParams = {}
): IIssuesFetchState => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [IssuesQueryKey, serializeRequestParamsForHub(params).toString()],
    queryFn: async () => await getCompositeIssues(params),
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
