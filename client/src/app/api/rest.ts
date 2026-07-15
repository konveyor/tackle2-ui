import axios, { RawAxiosRequestHeaders } from "axios";
import { template } from "radash";

import { serializeRequestParamsForHub } from "@app/hooks/table-controls";

import { HubPaginatedResult, HubRequestParams } from "./models";

export { template };
export function hub(tsa: TemplateStringsArray, ...vals: unknown[]): string {
  let path = "";
  tsa.forEach((str) => {
    path += str;
    if (vals.length > 0) {
      path += String(vals.shift());
    }
  });

  return `/hub${path}`;
}

export const FILES = hub`/files`;

export const HEADERS: Record<string, RawAxiosRequestHeaders> = {
  json: {
    Accept: "application/json",
  },
  form: {
    Accept: "multipart/form-data",
  },
  file: {
    Accept: "application/json",
  },
  yaml: {
    Accept: "application/x-yaml",
  },
  plain: {
    Accept: "test/plain",
  },
};

export * from "./rest/analysis";
export * from "./rest/analysis-profiles";
export * from "./rest/application-dependencies";
export * from "./rest/applications";
export * from "./rest/archetypes";
export * from "./rest/assessments";
export * from "./rest/business-services";
export * from "./rest/cache";
export * from "./rest/facts";
export * from "./rest/files";
export * from "./rest/generators";
export * from "./rest/identities";
export * from "./rest/imports";
export * from "./rest/job-functions";
export * from "./rest/migration-waves";
export * from "./rest/platforms";
export * from "./rest/proxies";
export * from "./rest/questionnaires";
export * from "./rest/reviews";
export * from "./rest/roles";
export * from "./rest/schemas";
export * from "./rest/scopes";
export * from "./rest/settings";
export * from "./rest/stakeholder-groups";
export * from "./rest/stakeholders";
export * from "./rest/tags";
export * from "./rest/targets";
export * from "./rest/task-groups";
export * from "./rest/tasks";
export * from "./rest/tickets";
export * from "./rest/tokens";
export * from "./rest/trackers";
export * from "./rest/users";

/**
 * Provide consistent fetch and processing for server side filtering and sorting with
 * paginated results.
 */
export const getHubPaginatedResult = <T>(
  url: string,
  params: HubRequestParams = {}
): Promise<HubPaginatedResult<T>> =>
  axios
    .get<T[]>(url, {
      params: serializeRequestParamsForHub(params),
    })
    .then(({ data, headers }) => ({
      data,
      total: headers["x-total"] ? parseInt(headers["x-total"], 10) : 0,
      params,
    }));
