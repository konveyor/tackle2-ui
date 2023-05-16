import { useQuery } from "@tanstack/react-query";
import { HubRequestParams } from "@app/api/models";
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
