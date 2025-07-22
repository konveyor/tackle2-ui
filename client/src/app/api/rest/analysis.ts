import axios from "axios";

import { hub, template, getHubPaginatedResult } from "../rest";
import {
  HubRequestParams,
  BaseAnalysisRuleReport,
  AnalysisAppReport,
  AnalysisIncident,
  AnalysisFileReport,
  AnalysisIssue,
  BaseAnalysisIssueReport,
} from "../models";

/*
  - Analysis uses a collection of rulesets containing rules, and activating labels to produce a
    report containing dependencies, insights, and incidents.
  - Dependencies are handled on their own page.
  - The insights view will only show insights with an effort =0.
  - Issues are insights with effort >0.
  - Insights have one or more incidents.
  - Incidents are a specific occurrence of the insight/issue/rule in a source file.
 */

const INSIGHT = hub`/analyses/insights/{{id}}`;
const INSIGHT_INCIDENTS = hub`/analyses/insights/{{id}}/incidents`;
const REPORT_INSIGHT_FILES = hub`/analyses/report/insights/{{id}}/files`;

const REPORT_ISSUES = hub`/analyses/report/rules?filter=effort>0`; // RuleReports
const REPORT_APP_ISSUES = hub`/analyses/report/applications/{{id}}/insights?filter=effort>0`; // AppInsightReports
const REPORT_ISSUES_APPS = hub`/analyses/report/insights/applications?filter=effort>0`; // InsightAppReports

const REPORT_INSIGHTS = hub`/analyses/report/rules?filter=effort=0`; // RuleReports
const REPORT_APP_INSIGHTS = hub`/analyses/report/applications/{{id}}/insights?filter=effort=0`; // AppInsightReports
const REPORT_INSIGHTS_APPS = hub`/analyses/report/insights/applications?filter=effort=0`; // InsightAppReports

export const getInsight = (id: number) =>
  axios
    .get<AnalysisIssue>(template(INSIGHT, { id }))
    .then((response) => response.data);

export const getInsightIncidents = (
  id: number,
  params: HubRequestParams = {}
) =>
  getHubPaginatedResult<AnalysisIncident>(
    template(INSIGHT_INCIDENTS, { id: id }),
    params
  );

export const getInsightFiles = (id: number, params: HubRequestParams = {}) =>
  getHubPaginatedResult<AnalysisFileReport>(
    template(REPORT_INSIGHT_FILES, { id }),
    params
  );

// Issue specific functions
export const getReportAllIssues = (params: HubRequestParams = {}) =>
  getHubPaginatedResult<BaseAnalysisRuleReport>(REPORT_ISSUES, params);

export const getReportApplicationIssues = (
  applicationId: number,
  params: HubRequestParams = {}
) =>
  getHubPaginatedResult<BaseAnalysisIssueReport>(
    template(REPORT_APP_ISSUES, { id: applicationId }),
    params
  );

export const getReportIssueApps = (params: HubRequestParams = {}) =>
  getHubPaginatedResult<AnalysisAppReport>(REPORT_ISSUES_APPS, params);

// Insight specific functions
export const getReportAllInsights = (params: HubRequestParams = {}) =>
  getHubPaginatedResult<BaseAnalysisRuleReport>(REPORT_INSIGHTS, params);

export const getReportApplicationInsights = (
  applicationId: number,
  params: HubRequestParams = {}
) =>
  getHubPaginatedResult<AnalysisAppReport>(
    template(REPORT_APP_INSIGHTS, { id: applicationId }),
    params
  );

export const getReportInsightApps = (params: HubRequestParams = {}) =>
  getHubPaginatedResult<AnalysisAppReport>(REPORT_INSIGHTS_APPS, params);
