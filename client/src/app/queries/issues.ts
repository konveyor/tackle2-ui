import { useQuery } from "@tanstack/react-query";
import {
  AnalysisIssueReport,
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

export interface IFetchRuleReportsState {
  result: HubPaginatedResult<AnalysisRuleReport>;
  isFetching: boolean;
  fetchError: unknown;
  refetch: () => void;
}

export const useFetchRuleReports = (
  enabled: boolean,
  params: HubRequestParams = {}
): IFetchRuleReportsState => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [RuleReportsQueryKey, params],
    queryFn: () => getRuleReports(params),
    onError: (error) => console.log("error, ", error),
    keepPreviousData: true,
    enabled,
  });

  const withUiId = useWithUiId(data?.data, (r) => `${r.ruleset}/${r.rule}`);
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

export interface IFetchIssueReportsState {
  result: HubPaginatedResult<AnalysisIssueReport>;
  isFetching: boolean;
  fetchError: unknown;
  refetch: () => void;
}

export const useFetchIssueReports = (
  applicationId?: number,
  params: HubRequestParams = {}
): IFetchIssueReportsState => {
  const { data, isLoading, error, refetch } = useQuery({
    enabled: applicationId !== undefined,
    queryKey: [IssueReportsQueryKey, applicationId, params],
    queryFn: () => getIssueReports(applicationId, params),
    onError: (error) => console.log("error, ", error),
    keepPreviousData: true,
  });

  const withUiId = useWithUiId(data?.data, (r) => `${r.ruleset}/${r.rule}`);
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
