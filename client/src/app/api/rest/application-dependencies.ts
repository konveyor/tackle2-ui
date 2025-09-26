import axios from "axios";

import {
  AnalysisAppDependency,
  AnalysisDependency,
  ApplicationDependency,
  HubRequestParams,
} from "../models";
import { HEADERS, getHubPaginatedResult, hub } from "../rest";

const DEPENDENCIES = hub`/dependencies`;
const ANALYSIS_DEPS = hub`/analyses/report/dependencies`;
const ANALYSIS_DEPS_APPS = hub`/analyses/report/dependencies/applications`;

interface DependencyParams {
  from?: string[];
  to?: string[];
}

export const getApplicationDependencies = (params?: DependencyParams) => {
  return axios
    .get<ApplicationDependency[]>(`${DEPENDENCIES}`, {
      params,
      headers: HEADERS.json,
    })
    .then((response) => response.data);
};

export const createApplicationDependency = (obj: ApplicationDependency) => {
  return axios
    .post<ApplicationDependency>(`${DEPENDENCIES}`, obj)
    .then((response) => response.data);
};

export const deleteApplicationDependency = (id: number) => {
  return axios
    .delete<void>(`${DEPENDENCIES}/${id}`)
    .then((response) => response.data);
};

export const getDependencies = (params: HubRequestParams = {}) =>
  getHubPaginatedResult<AnalysisDependency>(ANALYSIS_DEPS, params);

export const getAppDependencies = (params: HubRequestParams = {}) =>
  getHubPaginatedResult<AnalysisAppDependency>(ANALYSIS_DEPS_APPS, params);
