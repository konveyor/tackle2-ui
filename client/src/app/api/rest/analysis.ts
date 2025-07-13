import axios from "axios";
import { template } from "radash";
import { getHubPaginatedResult } from "../rest";
import {
  HubRequestParams,
  BaseAnalysisRuleReport,
  AnalysisAppReport,
  AnalysisIncident,
  AnalysisFileReport,
  AnalysisIssue,
  BaseAnalysisIssueReport,
} from "../models";

const ANALYSIS_ISSUE = "/hub/analyses/insights/{{id}}";
const ANALYSIS_ISSUE_INCIDENTS = "/hub/analyses/insights/{{id}}/incidents";
const ANALYSIS_RULES = "/hub/analyses/report/rules?filter=effort>0";
const ANALYSIS_APP_ISSUES =
  "/hub/analyses/report/applications/{{id}}/insights?filter=effort>0";
const ANALYSIS_ISSUES_APPS =
  "/hub/analyses/report/insights/applications?filter=effort>0";
const ANALYSIS_ISSUE_FILES = "/hub/analyses/report/insights/{{id}}/files";

export const getRuleReports = (params: HubRequestParams = {}) =>
  getHubPaginatedResult<BaseAnalysisRuleReport>(ANALYSIS_RULES, params);

export const getAppReports = (params: HubRequestParams = {}) =>
  getHubPaginatedResult<AnalysisAppReport>(ANALYSIS_ISSUES_APPS, params);

export const getIssueReports = (
  applicationId?: number,
  params: HubRequestParams = {}
) =>
  getHubPaginatedResult<BaseAnalysisIssueReport>(
    template(ANALYSIS_APP_ISSUES, { id: applicationId }),
    params
  );

export const getIssue = (issueId: number) =>
  axios
    .get<AnalysisIssue>(template(ANALYSIS_ISSUE, { id: issueId }))
    .then((response) => response.data);

export const getFileReports = (
  issueId?: number,
  params: HubRequestParams = {}
) =>
  issueId
    ? getHubPaginatedResult<AnalysisFileReport>(
        template(ANALYSIS_ISSUE_FILES, { id: issueId }),
        params
      )
    : Promise.reject();

export const getIncidents = (
  issueId?: number,
  params: HubRequestParams = {}
) =>
  issueId
    ? getHubPaginatedResult<AnalysisIncident>(
        template(ANALYSIS_ISSUE_INCIDENTS, { id: issueId }),
        params
      )
    : Promise.reject();
