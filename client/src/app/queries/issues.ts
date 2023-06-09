import { useQuery } from "@tanstack/react-query";
import {
  AnalysisRuleReport,
  HubPaginatedResult,
  HubRequestParams,
} from "@app/api/models";
import {
  getRuleReports,
  getIssues,
  getAppReports,
  getFileReports,
  getIncidents,
} from "@app/api/rest";
import { serializeRequestParamsForHub } from "@app/shared/hooks/table-controls";

export const RuleReportsQueryKey = "rulereports";
export const AppReportsQueryKey = "appreports";
export const FileReportsQueryKey = "filereports";
export const IssuesQueryKey = "issues";
export const IncidentsQueryKey = "incidents";

export const useFetchRuleReports = (params: HubRequestParams = {}) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      RuleReportsQueryKey,
      serializeRequestParamsForHub(params).toString(),
    ],
    queryFn: async () => await getRuleReports(params),
    onError: (error) => console.log("error, ", error),
    keepPreviousData: true,
    select: (result): HubPaginatedResult<AnalysisRuleReport> => {
      // There is no single unique id property on the hub's composite report objects.
      // We need to create one for table hooks to work.
      const processedData = result.data.map(
        (baseRuleReport): AnalysisRuleReport => ({
          ...baseRuleReport,
          _ui_unique_id: `${baseRuleReport.ruleset}/${baseRuleReport.rule}`,
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

export const useFetchAppReports = (params: HubRequestParams = {}) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      AppReportsQueryKey,
      serializeRequestParamsForHub(params).toString(),
    ],
    queryFn: async () => await getAppReports(params),
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

export const useFetchFileReports = (
  issueId?: number,
  params: HubRequestParams = {}
) => {
  const { data, isLoading, error, refetch } = useQuery({
    enabled: issueId !== undefined,
    queryKey: [
      FileReportsQueryKey,
      issueId,
      serializeRequestParamsForHub(params).toString(),
    ],
    queryFn: async () => await getFileReports(issueId, params),
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

export const useFetchIncidents = (
  issueId?: number,
  params: HubRequestParams = {}
) => {
  const { data, isLoading, error, refetch } = useQuery({
    enabled: issueId !== undefined,
    queryKey: [
      IncidentsQueryKey,
      issueId,
      serializeRequestParamsForHub(params).toString(),
    ],
    queryFn: async () => await getIncidents(issueId, params),
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
