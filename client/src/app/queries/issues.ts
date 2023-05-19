import { useQuery } from "@tanstack/react-query";
import {
  AnalysisCompositeIssue,
  HubPaginatedResult,
  HubRequestParams,
} from "@app/api/models";
import { getCompositeIssues, getIssues } from "@app/api/rest";
import { serializeRequestParamsForHub } from "@app/shared/hooks/table-controls";

export const CompositeIssuesQueryKey = "compositeissues";
export const IssuesQueryKey = "issues";

export const useFetchCompositeIssues = (params: HubRequestParams = {}) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      CompositeIssuesQueryKey,
      serializeRequestParamsForHub(params).toString(),
    ],
    queryFn: async () => await getCompositeIssues(params),
    onError: (error) => console.log("error, ", error),
    keepPreviousData: true,
    select: (result): HubPaginatedResult<AnalysisCompositeIssue> => {
      // There is no single unique id property on the hub's composite issue objects.
      // We need to create one for table hooks to work.
      const processedData = result.data.map(
        (baseCompositeIssue): AnalysisCompositeIssue => ({
          ...baseCompositeIssue,
          _ui_unique_id: `${baseCompositeIssue.ruleSet}/${baseCompositeIssue.rule}`,
        })
      );
      return { ...result, data: processedData };
    },
  });
  return {
    result: data || { data: [], total: 0, params },
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useFetchIssues = (params: HubRequestParams = {}) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [IssuesQueryKey, serializeRequestParamsForHub(params).toString()],
    queryFn: async () => await getIssues(params),
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
