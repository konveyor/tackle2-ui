import { useQuery } from "@tanstack/react-query";
import {
  AnalysisIssueReport,
  AnalysisRuleReport,
  HubPaginatedResult,
  HubRequestParams,
  WithUiId,
} from "@app/api/models";
import {
  getRuleReports,
  getAppReports,
  getFileReports,
  getIncidents,
  getIssueReports,
  getIssue,
} from "@app/api/rest";
import { useWithUiId } from "@app/utils/query-utils";

export const RuleReportsQueryKey = "rulereports";
export const AppReportsQueryKey = "appreports";
export const IssueReportsQueryKey = "issuereports";
export const FileReportsQueryKey = "filereports";
export const IssuesQueryKey = "issues";
export const IssueQueryKey = "issue";
export const IncidentsQueryKey = "incidents";

export const useFetchRuleReports = (
  enabled: boolean,
  params: HubRequestParams = {},
  refetchInterval: number | false = false
) => {
  const {
    data: ruleReport,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [RuleReportsQueryKey, params],
    queryFn: () => getRuleReports(params),
    onError: (error) => console.log("error, ", error),
    keepPreviousData: true,
    enabled,
    refetchInterval,
  });

  const withUiId = useWithUiId(
    ruleReport?.data,
    (r) => `${r.ruleset}/${r.rule}`
  );
  return {
    result: {
      data: withUiId,
      total: ruleReport?.total ?? 0,
      params: ruleReport?.params ?? params,
    } as HubPaginatedResult<WithUiId<AnalysisRuleReport>>,
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useFetchAppReports = (
  params: HubRequestParams = {},
  refetchInterval: number | false = false
) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [AppReportsQueryKey, params],
    queryFn: () => getAppReports(params),
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

export const useFetchIssueReports = (
  applicationId?: number,
  params: HubRequestParams = {},
  refetchInterval: number | false = false
) => {
  const {
    data: issueReport,
    isLoading,
    error,
    refetch,
  } = useQuery({
    enabled: applicationId !== undefined,
    queryKey: [IssueReportsQueryKey, applicationId, params],
    queryFn: () => getIssueReports(applicationId, params),
    onError: (error) => console.log("error, ", error),
    keepPreviousData: true,
    refetchInterval,
  });

  const withUiId = useWithUiId(
    issueReport?.data,
    (r) => `${r.ruleset}/${r.rule}`
  );
  return {
    result: {
      data: withUiId,
      total: issueReport?.total ?? 0,
      params: issueReport?.params ?? params,
    } as HubPaginatedResult<AnalysisIssueReport>,
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useFetchIssue = (
  issueId?: number,
  refetchInterval: number | false = false
) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [IssueQueryKey, issueId],
    queryFn: () => getIssue(issueId!),
    onError: (error) => console.log("error, ", error),
    enabled: !!issueId,
    refetchInterval,
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
  params: HubRequestParams = {},
  refetchInterval: number | false = false
) => {
  const { data, isLoading, error, refetch } = useQuery({
    enabled: issueId !== undefined,
    queryKey: [FileReportsQueryKey, issueId, params],
    queryFn: () => getFileReports(issueId, params),
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

export const useFetchIncidents = (
  issueId?: number,
  params: HubRequestParams = {},
  refetchInterval: number | false = false
) => {
  const { data, isLoading, error, refetch } = useQuery({
    enabled: issueId !== undefined,
    queryKey: [IncidentsQueryKey, issueId, params],
    queryFn: () => getIncidents(issueId, params),
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
