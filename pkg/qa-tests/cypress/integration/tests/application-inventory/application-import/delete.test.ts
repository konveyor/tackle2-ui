/// <reference types="cypress" />
/// <reference types="cypress-keycloak-commands" />

import { ApplicationImportPage } from "../../../models/application-import";

describe("Delete import application", () => {
  const baseFilePath = "application-import/";
  const applicationImport = new ApplicationImportPage();

  before(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    cy.get<KcTokens>("@tokens").then((tokens) => {      
      cy.api_clean(tokens, "BusinessService");
      cy.api_clean(tokens, "TagType");

      const tagTypes = [];

      cy.log("")
        .then(() => {
          // Create business services
          return [...Array(3)]
            .map((_, i) => ({
              name: `service-${(i + 10).toString(36)}`,
            }))
            .forEach((payload) => {
              cy.api_crud(tokens, "BusinessService", "POST", payload);
            });
        })
        .then(() => {
          // Create tag types
          return [...Array(2)]
            .map((_, i) => ({
              name: `tagType-${(i + 10).toString(36)}`,
            }))
            .forEach((payload) => {
              cy.api_crud(tokens, "TagType", "POST", payload).then((data) => {
                tagTypes.push(data);
              });
            });
        })
        .then(() => {
          // Create tags
          return [...Array(2)]
            .map((_, i) => {
              return [
                {
                  name: `tag-a-${(i + 10).toString(36)}`,
                  tagType: tagTypes[i],
                },
                {
                  name: `tag-b-${(i + 10).toString(36)}`,
                  tagType: tagTypes[i],
                },
              ];
            })
            .flatMap((a) => a)
            .forEach((payload) => {
              cy.api_crud(tokens, "Tag", "POST", payload);
            });
        });
    });
  });

  beforeEach(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.api_clean(tokens, "ImportSummary");
      cy.api_clean(tokens, "Application");
    });
  });

  it("Delete the only item available", () => {
    // Create application-summary to delete
    applicationImport.create({
      fileName: baseFilePath + "invalid_application_rows.csv",
    });

    // Delete application-summary
    applicationImport.delete(0);

    // Verify table
    cy.get(
      ".pf-c-empty-state > .pf-c-empty-state__content > .pf-c-title"
    ).contains("No data available");
  });
});
