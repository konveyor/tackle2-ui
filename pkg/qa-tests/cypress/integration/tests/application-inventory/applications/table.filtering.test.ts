/// <reference types="cypress" />
/// <reference types="cypress-keycloak-commands" />

import { ApplicationPage } from "../../../models/application";

describe("Filter applications", () => {
  const application = new ApplicationPage();

  before(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    // Data

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.api_clean(tokens, "Application");
      cy.api_clean(tokens, "BusinessService");
      cy.api_clean(tokens, "TagType");

      const businessServices = [];
      const tagTypes = [];
      const tags = [];

      cy.log("")
        .then(() => {
          // Create business services
          return [...Array(11)]
            .map((_, i) => ({
              name: `service-${(i + 10).toString(36)}`,
            }))
            .forEach((payload) => {
              cy.api_crud(
                tokens,
                "BusinessService",
                "POST",
                payload
              ).then((responseData) => businessServices.push(responseData));
            });
        })
        .then(() => {
          // Create tag types
          return [...Array(6)]
            .map((_, i) => ({
              name: `tagType-${(i + 10).toString(36)}`,
            }))
            .forEach((payload) => {
              cy.api_crud(
                tokens,
                "TagType",
                "POST",
                payload
              ).then((responseData) => tagTypes.push(responseData));
            });
        })
        .then(() => {
          // Create tags
          return [...Array(6)]
            .map((_, i) => [
              {
                name: `tag-${(i + 10).toString(36)}-1`,
                tagType: tagTypes[i],
              },
              {
                name: `tag-${(i + 10).toString(36)}-2`,
                tagType: tagTypes[i],
              },
            ])
            .flatMap((e) => e)
            .forEach((payload) => {
              cy.api_crud(tokens, "Tag", "POST", payload).then((responseData) =>
                tags.push(responseData)
              );
            });
        })
        .then(() => {
          // Create applications
          return [...Array(11)]
            .map((_, i) => ({
              name: `application-${(i + 10).toString(36)}`,
              description: `description-${(i + 10).toString(36)}`,
              businessService: businessServices[i].id,
              tags: [tags[i].id],
            }))
            .forEach((payload) => {
              cy.api_crud(tokens, "Application", "POST", payload);
            });
        });
    });
  });

  beforeEach(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");
  });

  it("By name", () => {
    const filterIndex = 0;
    application.openPage();

    // First filter
    application.applyFilter(filterIndex, "application-a");

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("application-a");

    // Second filter
    application.applyFilter(filterIndex, "application-k");

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("application-a");
    cy.get(".pf-c-table").pf4_table_rows().eq(1).contains("application-k");
  });

  it("By description", () => {
    const filterIndex = 1;
    application.openPage();

    // First filter
    application.applyFilter(filterIndex, "description-a");

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("description-a");

    // Second filter
    application.applyFilter(filterIndex, "description-k");

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("description-a");
    cy.get(".pf-c-table").pf4_table_rows().eq(1).contains("description-k");
  });

  it("By business service", () => {
    const filterIndex = 2;
    application.openPage();

    // First filter
    application.applyFilter(filterIndex, "service-a");

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("service-a");

    // Second filter
    application.applyFilter(filterIndex, "service-k");

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("service-a");
    cy.get(".pf-c-table").pf4_table_rows().eq(1).contains("service-k");
  });

  it("By tags", () => {
    const filterIndex = 3;
    application.openPage();

    // First filter
    application.applyFilter(filterIndex, "tag-a-1");

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("application-a");

    // Second filter
    application.applyFilter(filterIndex, "tag-a-2");

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("application-a");
    cy.get(".pf-c-table").pf4_table_rows().eq(1).contains("application-b");
  });
});
