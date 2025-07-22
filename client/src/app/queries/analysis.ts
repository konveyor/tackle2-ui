import { useQuery } from "@tanstack/react-query";
import {
  HubPaginatedResult,
  HubRequestParams,
  WithUiId,
} from "@app/api/models";
import {
  getInsight,
  getInsightFiles,
  getInsightIncidents,
  getReportAllInsights,
  getReportAllIssues,
  getReportApplicationInsights,
  getReportApplicationIssues,
  getReportInsightApps,
  getReportIssueApps,
} from "@app/api/rest";
import { useWithUiId } from "@app/utils/query-utils";

export const AllIssuesQueryKey = "analysis-all-issues";
export const AppIssuesQueryKey = "analysis-app-issues";
export const IssueAppsQueryKey = "analysis-issue-apps";

export const AllInsightsQueryKey = "analysis-all-insights";
export const AppInsightsQueryKey = "analysis-app-insights";
export const InsightAppsQueryKey = "analysis-insight-apps";

export const InsightQueryKey = "analysis-insight";
export const IncidentsQueryKey = "analysis-insight-incidents";
export const InsightFilesQueryKey = "analysis-insight-files";

export const useFetchReportAllIssues = (
  enabled: boolean,
  params: HubRequestParams = {},
  refetchInterval: number | false = false
) =>
  useFetchReportAll_(
    AllIssuesQueryKey,
    getReportAllIssues,
    (r) => `${r.ruleset}/${r.rule}`,
    enabled,
    params,
    refetchInterval
  );

export const useFetchReportAllInsights = (
  enabled: boolean,
  params: HubRequestParams = {},
  refetchInterval: number | false = false
) =>
  useFetchReportAll_(
    AllInsightsQueryKey,
    getReportAllInsights,
    (r) => `${r.ruleset}/${r.rule}`,
    enabled,
    params,
    refetchInterval
  );

const useFetchReportAll_ = <T>(
  queryKey: string,
  queryFn: (params: HubRequestParams) => Promise<HubPaginatedResult<T>>,
  mapUiId: (data: T) => string,
  enabled: boolean,
  params: HubRequestParams,
  refetchInterval: number | false
) => {
  const { data: report, ...rest } = useQuery({
    enabled,
    queryKey: [queryKey, params],
    queryFn: () => queryFn(params),
    refetchInterval,
  });
  const withUiId = useWithUiId(report?.data, mapUiId);
  return {
    ...rest,
    fetchError: rest.error,
    result: {
      data: withUiId,
      total: report?.total ?? 0,
      params: report?.params ?? params,
    } as HubPaginatedResult<WithUiId<T>>,
  };
};

export const useFetchReportApplicationIssues = (
  applicationId?: number,
  params: HubRequestParams = {},
  refetchInterval: number | false = false
) =>
  useFetchReportApplication_(
    AppIssuesQueryKey,
    getReportApplicationIssues,
    (r) => `${r.ruleset}/${r.rule}`,
    applicationId,
    params,
    refetchInterval
  );

export const useFetchReportApplicationInsights = (
  applicationId?: number,
  params: HubRequestParams = {},
  refetchInterval: number | false = false
) =>
  useFetchReportApplication_(
    AppInsightsQueryKey,
    getReportApplicationInsights,
    (r) => `${r.ruleset}/${r.rule}`,
    applicationId,
    params,
    refetchInterval
  );

const useFetchReportApplication_ = <T>(
  queryKey: string,
  queryFn: (
    id: number,
    params: HubRequestParams
  ) => Promise<HubPaginatedResult<T>>,
  mapUiId: (data: T) => string,
  applicationId?: number,
  params: HubRequestParams = {},
  refetchInterval: number | false = false
) => {
  const { data: issueReport, ...rest } = useQuery({
    enabled: applicationId !== undefined,
    queryKey: [queryKey, applicationId, params],
    queryFn: () =>
      applicationId === undefined
        ? Promise.resolve(undefined)
        : queryFn(applicationId, params),
    refetchInterval,
  });
  const withUiId = useWithUiId(issueReport?.data, mapUiId);
  return {
    ...rest,
    fetchError: rest.error,
    result: {
      data: withUiId,
      total: issueReport?.total ?? 0,
      params: issueReport?.params ?? params,
    } as HubPaginatedResult<WithUiId<T>>,
  };
};

export const useFetchReportIssueApps = (
  params: HubRequestParams = {},
  refetchInterval: number | false = false
) =>
  useFetchReport_Apps(
    IssueAppsQueryKey,
    getReportIssueApps,
    params,
    refetchInterval
  );

export const useFetchReportInsightApps = (
  params: HubRequestParams = {},
  refetchInterval: number | false = false
) =>
  useFetchReport_Apps(
    InsightAppsQueryKey,
    getReportInsightApps,
    params,
    refetchInterval
  );

const useFetchReport_Apps = <T>(
  queryKey: string,
  queryFn: (params: HubRequestParams) => Promise<HubPaginatedResult<T>>,
  params: HubRequestParams,
  refetchInterval: number | false
) => {
  const { data, ...rest } = useQuery({
    queryKey: [queryKey, params],
    queryFn: () => queryFn(params),
    refetchInterval,
  });
  return {
    ...rest,
    fetchError: rest.error,
    result: data || { data: [], total: 0, params },
  };
};

// Generic for issues and insights
export const useFetchInsight = (
  id?: number,
  refetchInterval: number | false = false
) => {
  const { data, isLoading, error, refetch } = useQuery({
    enabled: id !== undefined,
    queryKey: [InsightQueryKey, id],
    queryFn: () =>
      id === undefined ? Promise.resolve(undefined) : getInsight(id),
    onError: (error) => console.log("error, ", error),
    refetchInterval,
  });
  return {
    result: { data },
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useFetchIncidents = (
  insightId?: number,
  params: HubRequestParams = {},
  refetchInterval: number | false = false
) => {
  const { data, isLoading, error, refetch } = useQuery({
    enabled: insightId !== undefined,
    queryKey: [IncidentsQueryKey, insightId, params],
    queryFn: () =>
      insightId === undefined
        ? Promise.resolve(undefined)
        : getInsightIncidents(insightId, params),
    onError: (error) => console.log("error, ", error),
    refetchInterval,
  });
  return {
    result: data || { data: [], total: 0, params },
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useFetchReportInsightFiles = (
  insightId?: number,
  params: HubRequestParams = {},
  refetchInterval: number | false = false
) => {
  const { data, isLoading, error, refetch } = useQuery({
    enabled: insightId !== undefined,
    queryKey: [InsightFilesQueryKey, insightId, params],
    queryFn: () =>
      insightId === undefined
        ? Promise.resolve(undefined)
        : getInsightFiles(insightId, params),
    onError: (error) => console.log("error, ", error),
    refetchInterval,
  });
  return {
    result: data || { data: [], total: 0, params },
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};
