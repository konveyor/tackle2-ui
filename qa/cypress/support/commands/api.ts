/// <reference types="cypress" />

import { buildHeadersWithHAL_JSON, buildHeadersWithJSON } from "./utils";

const sizeQueryParam = "size=1000";
const controlsBaseUrl = "/api/controls";
const applicationInventoryBaseUrl = "/api/application-inventory";
const pathfinderBaseUrl = "/api/pathfinder";

export type ResourceType =
  | "JobFunction"
  | "Stakeholder"
  | "StakeholderGroup"
  | "BusinessService"
  | "TagType"
  | "Tag"
  | "Application"
  | "ApplicationsDependency"
  | "ImportSummary"
  | "Assessment";

const allResourceTypes: ResourceType[] = [
  "JobFunction",
  "Stakeholder",
  "StakeholderGroup",
  "BusinessService",
  "TagType",
  "Tag",
  "Application",
  "ApplicationsDependency",
  "ImportSummary",
  // "Assessment",
];

type ResourceTypeList = {
  [key in ResourceType]: {
    baseUrl: string;
    _embeddedField: string;
  };
};

const resourceTypeList: ResourceTypeList = {
  JobFunction: {
    baseUrl: `${controlsBaseUrl}/job-function`,
    _embeddedField: "job-function",
  },
  Stakeholder: {
    baseUrl: `${controlsBaseUrl}/stakeholder`,
    _embeddedField: "stakeholder",
  },
  StakeholderGroup: {
    baseUrl: `${controlsBaseUrl}/stakeholder-group`,
    _embeddedField: "stakeholder-group",
  },
  BusinessService: {
    baseUrl: `${controlsBaseUrl}/business-service`,
    _embeddedField: "business-service",
  },
  TagType: {
    baseUrl: `${controlsBaseUrl}/tag-type`,
    _embeddedField: "tag-type",
  },
  Tag: {
    baseUrl: `${controlsBaseUrl}/tag`,
    _embeddedField: "tag",
  },
  Application: {
    baseUrl: `${applicationInventoryBaseUrl}/application`,
    _embeddedField: "application",
  },
  ApplicationsDependency: {
    baseUrl: `${applicationInventoryBaseUrl}/applications-dependency`,
    _embeddedField: "applications-dependency",
  },
  ImportSummary: {
    baseUrl: `${applicationInventoryBaseUrl}/import-summary`,
    _embeddedField: "import-summary",
  },
  Assessment: {
    baseUrl: `${pathfinderBaseUrl}/assessments`,
    _embeddedField: undefined,
  },
};

const create = (headers: any, url: string, payload: any) => {
  cy.request({
    method: "POST",
    headers: headers,
    body: payload,
    url: url,
  }).its("body");
};

const singleRequest = (
  headers: any,
  url: string,
  payload: any,
  method: "PUT" | "PATCH" | "DELETE"
) => {
  cy.request({
    method: method,
    headers: headers,
    body: payload,
    url: `${url}/${payload.id}`,
  }).its("body");
};

const deleteAll = (headers: any, url: string, embeddedField: string) => {
  cy.request({
    method: "GET",
    headers: headers,
    url: `${url}?${sizeQueryParam}`,
  })
    .then((response) =>
      embeddedField ? response.body._embedded[embeddedField] : response.body
    )
    .each((item: any) =>
      cy.request({
        method: "DELETE",
        headers: headers,
        url: `${url}/${item.id}`,
      })
    );
};

// Utils

const getHeadersFromResourceType = (
  resourceType: ResourceType,
  tokens: KcTokens
) => {
  let headers;
  switch (resourceType) {
    case "Assessment":
      headers = buildHeadersWithJSON(tokens);
      break;
    default:
      headers = buildHeadersWithHAL_JSON(tokens);
      break;
  }
  return headers;
};
// Commands

declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      api_crud(
        tokens: KcTokens,
        resource: ResourceType,
        method: "POST" | "PUT" | "PATCH" | "DELETE",
        payload: any
      ): Chainable<any>;
      api_clean(tokens: KcTokens, resource?: ResourceType): void;
    }
  }
}

Cypress.Commands.add(
  "api_crud",
  (
    tokens: KcTokens,
    resource: ResourceType,
    method: "POST" | "PUT" | "PATCH" | "DELETE",
    payload: any
  ) => {
    const headers = getHeadersFromResourceType(resource, tokens);
    const type = resourceTypeList[resource];

    switch (method) {
      case "POST":
        create(headers, type.baseUrl, payload);
        break;
      case "PUT":
      case "PATCH":
      case "DELETE":
        singleRequest(headers, type.baseUrl, payload, method);
        break;
    }
  }
);

Cypress.Commands.add(
  "api_clean",
  (tokens: KcTokens, resource?: ResourceType) => {
    const headers = getHeadersFromResourceType(resource, tokens);

    if (resource) {
      const type = resourceTypeList[resource];
      deleteAll(headers, type.baseUrl, type._embeddedField);
    } else {
      allResourceTypes.forEach((e) => {
        const type = resourceTypeList[e];
        deleteAll(headers, type.baseUrl, type._embeddedField);
      });
    }
  }
);

export {};
