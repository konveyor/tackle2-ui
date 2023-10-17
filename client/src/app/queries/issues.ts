import { useQuery } from "@tanstack/react-query";
import {
  AnalysisIssueReport,
  AnalysisRuleReport,
  BaseAnalysisIssueReport,
  BaseAnalysisRuleReport,
  HubPaginatedResult,
  HubRequestParams,
  WithUiId,
} from "@app/api/models";
import {
  getRuleReports,
  getIssues,
  getAppReports,
  getFileReports,
  getIncidents,
  getIssueReports,
  getIssue,
} from "@app/api/rest";

export const RuleReportsQueryKey = "rulereports";
export const AppReportsQueryKey = "appreports";
export const IssueReportsQueryKey = "issuereports";
export const FileReportsQueryKey = "filereports";
export const IssuesQueryKey = "issues";
export const IssueQueryKey = "issue";
export const IncidentsQueryKey = "incidents";

const injectUiUniqueIds = <
  T extends BaseAnalysisRuleReport | BaseAnalysisIssueReport,
>(
  result: HubPaginatedResult<T>
): HubPaginatedResult<WithUiId<T>> => {
  // There is no single unique id property on some of the hub's composite report objects.
  // We need to create one for table hooks to work.
  const processedData = result.data.map(
    (baseReport): WithUiId<T> => ({
      ...baseReport,
      _ui_unique_id: `${baseReport.ruleset}/${baseReport.rule}`,
    })
  );
  return { ...result, data: processedData };
};

export const useFetchRuleReports = (
  enabled: boolean,
  params: HubRequestParams = {}
) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [RuleReportsQueryKey, params],
    queryFn: () => getRuleReports(params),
    onError: (error) => console.log("error, ", error),
    keepPreviousData: true,
    select: (result): HubPaginatedResult<AnalysisRuleReport> =>
      injectUiUniqueIds(result),
    enabled,
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
    queryKey: [AppReportsQueryKey, params],
    queryFn: () => getAppReports(params),
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

export const useFetchIssueReports = (
  applicationId?: number,
  params: HubRequestParams = {}
) => {
  const { data, isLoading, error, refetch } = useQuery({
    enabled: applicationId !== undefined,
    queryKey: [IssueReportsQueryKey, applicationId, params],
    queryFn: () => getIssueReports(applicationId, params),
    onError: (error) => console.log("error, ", error),
    keepPreviousData: true,
    select: (result): HubPaginatedResult<AnalysisIssueReport> =>
      injectUiUniqueIds(result),
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
    queryKey: [IssuesQueryKey, params],
    queryFn: () => getIssues(params),
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

export const useFetchIssue = (issueId?: number) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [IssueQueryKey, issueId],
    queryFn: () => getIssue(issueId!),
    onError: (error) => console.log("error, ", error),
    enabled: !!issueId,
  });
  return {
    result: { data },
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
    queryKey: [FileReportsQueryKey, issueId, params],
    queryFn: () => getFileReports(issueId, params),
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
    queryKey: [IncidentsQueryKey, issueId, params],
    queryFn: () => getIncidents(issueId, params),
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
