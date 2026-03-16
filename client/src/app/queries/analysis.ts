import { useQuery } from "@tanstack/react-query";

import {
  AnalysisIncident,
  AnalysisInsight,
  AnalysisReportApplicationInsight,
  AnalysisReportFile,
  AnalysisReportInsight,
  HubPaginatedResult,
  HubRequestParams,
  UiAnalysisReportApplicationInsight,
  UiAnalysisReportInsight,
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

export interface AnalysisQueryResults<E> {
  result: HubPaginatedResult<E>;
  isFetching: boolean;
  fetchError: Error | undefined;
  refetch: () => void;
}

export interface AnalysisQueryResult<E> {
  result: { data?: E };
  isFetching: boolean;
  fetchError: Error | undefined;
  refetch: () => void;
}

/** List of filtered/sorted _issues_ with summary count of affected applications */
export const useFetchReportAllIssues = (
  enabled: boolean,
  params: HubRequestParams = {},
  refetchInterval: number | false = false
) =>
  useFetchReportAll_<UiAnalysisReportInsight, AnalysisReportInsight>(
    AllIssuesQueryKey,
    getReportAllIssues,
    (r) => `${r.ruleset}/${r.rule}`,
    enabled,
    params,
    refetchInterval
  );

/** List of filtered/sorted _insights_ with summary count of affected applications */
export const useFetchReportAllInsights = (
  enabled: boolean,
  params: HubRequestParams = {},
  refetchInterval: number | false = false
) =>
  useFetchReportAll_<UiAnalysisReportInsight, AnalysisReportInsight>(
    AllInsightsQueryKey,
    getReportAllInsights,
    (r) => `${r.ruleset}/${r.rule}`,
    enabled,
    params,
    refetchInterval
  );

const useFetchReportAll_ = <UI extends WithUiId<API>, API>(
  queryKey: string,
  queryFn: (params: HubRequestParams) => Promise<HubPaginatedResult<API>>,
  mapUiId: (data: API) => string,
  enabled: boolean,
  params: HubRequestParams,
  refetchInterval: number | false
): AnalysisQueryResults<UI> => {
  const { data, isLoading, error, refetch } = useQuery({
    enabled,
    queryKey: [queryKey, params],
    queryFn: () => queryFn(params),
    refetchInterval,
  });
  return {
    result: {
      data: useWithUiId(data?.data, mapUiId),
      total: data?.total ?? 0,
      params: data?.params ?? params,
    },
    isFetching: isLoading,
    fetchError: error as Error | undefined,
    refetch,
  };
};

/** List of filtered/sorted _issues_ for a single application with summary count of affected files */
export const useFetchReportApplicationIssues = (
  applicationId?: number,
  params: HubRequestParams = {},
  refetchInterval: number | false = false
) =>
  useFetchReportApplication_<
    UiAnalysisReportApplicationInsight,
    AnalysisReportApplicationInsight
  >(
    AppIssuesQueryKey,
    getReportApplicationIssues,
    (r) => `${r.ruleset}/${r.rule}`,
    applicationId,
    params,
    refetchInterval
  );

/** List of filtered/sorted _insights_ for a single application with summary count of affected files */
export const useFetchReportApplicationInsights = (
  applicationId?: number,
  params: HubRequestParams = {},
  refetchInterval: number | false = false
) =>
  useFetchReportApplication_<
    UiAnalysisReportApplicationInsight,
    AnalysisReportApplicationInsight
  >(
    AppInsightsQueryKey,
    getReportApplicationInsights,
    (r) => `${r.ruleset}/${r.rule}`,
    applicationId,
    params,
    refetchInterval
  );

const useFetchReportApplication_ = <UI extends WithUiId<API>, API>(
  queryKey: string,
  queryFn: (
    id: number,
    params: HubRequestParams
  ) => Promise<HubPaginatedResult<API>>,
  mapUiId: (data: API) => string,
  applicationId?: number,
  params: HubRequestParams = {},
  refetchInterval: number | false = false
): AnalysisQueryResults<UI> => {
  const { data, isLoading, error, refetch } = useQuery({
    enabled: applicationId !== undefined,
    queryKey: [queryKey, applicationId, params],
    queryFn: () =>
      applicationId === undefined
        ? Promise.resolve(undefined)
        : queryFn(applicationId, params),
    refetchInterval,
  });
  return {
    result: {
      data: useWithUiId(data?.data, mapUiId),
      total: data?.total ?? 0,
      params: data?.params ?? params,
    },
    isFetching: isLoading,
    fetchError: error as Error | undefined,
    refetch,
  };
};

/** List of filtered/sorted _application_ / _issue_ pairs with summary effort, incident count, and file count */
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

/** List of filtered/sorted _application_ / _insight_ pairs with summary effort, incident count, and file count */
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

const useFetchReport_Apps = <API>(
  queryKey: string,
  queryFn: (params: HubRequestParams) => Promise<HubPaginatedResult<API>>,
  params: HubRequestParams,
  refetchInterval: number | false
): AnalysisQueryResults<API> => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [queryKey, params],
    queryFn: () => queryFn(params),
    refetchInterval,
  });
  return {
    result: data || { data: [], total: 0, params },
    isFetching: isLoading,
    fetchError: error as Error | undefined,
    refetch,
  };
};

// Generic for issues and insights
export const useFetchInsight = (
  id?: number,
  refetchInterval: number | false = false
): AnalysisQueryResult<AnalysisInsight> => {
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
    fetchError: error as Error | undefined,
    refetch,
  };
};

export const useFetchIncidentsForInsight = (
  insightId?: number,
  params: HubRequestParams = {},
  refetchInterval: number | false = false
): AnalysisQueryResults<AnalysisIncident> => {
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
    fetchError: error as Error | undefined,
    refetch,
  };
};

export const useFetchReportInsightFiles = (
  insightId?: number,
  params: HubRequestParams = {},
  refetchInterval: number | false = false
): AnalysisQueryResults<WithUiId<AnalysisReportFile>> => {
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

  const withUiId = useWithUiId(
    data?.data,
    (fileReport) => `${fileReport.insightId}/${fileReport.file}`
  );

  return {
    result: {
      data: withUiId,
      total: data?.total ?? 0,
      params: data?.params ?? params,
    },
    isFetching: isLoading,
    fetchError: error as Error | undefined,
    refetch,
  };
};
