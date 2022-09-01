/// <reference types="cypress" />
/// <reference types="cypress-keycloak-commands" />

import { ApplicationImportPage } from "../../../models/application-import";

describe("Create import application through CSV", () => {
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

  it("With valid CSV file", () => {
    applicationImport.create({
      fileName: baseFilePath + "valid_application_rows.csv",
    });

    // Verify table
    cy.get(".pf-c-table").pf4_table_rows().eq(0).as("row");

    cy.get("@row")
      .find("td[data-label='File name']")
      .should("contain", "valid_application_rows.csv");
    cy.get("@row")
      .find("td[data-label='Status']")
      .should("contain", "Completed");
    cy.get("@row").find("td[data-label='Accepted']").should("contain", "2");
    cy.get("@row").find("td[data-label='Rejected']").should("contain", "0");
  });

  it("With invalid CSV file", () => {
    applicationImport.create({
      fileName: baseFilePath + "invalid_application_rows.csv",
    });

    // Verify table
    cy.get(".pf-c-table").pf4_table_rows().eq(0).as("row");

    cy.get("@row")
      .find("td[data-label='File name']")
      .should("contain", "invalid_application_rows.csv");
    cy.get("@row").find("td[data-label='Status']").should("contain", "Error");
    cy.get("@row").find("td[data-label='Accepted']").should("contain", "0");
    cy.get("@row").find("td[data-label='Rejected']").should("contain", "0");
  });

  it.only("With partially valid CSV file", () => {
    applicationImport.create({
      fileName: baseFilePath + "partially_valid_application_rows.csv",
    });

    // Verify table
    cy.get(".pf-c-table").pf4_table_rows().eq(0).as("row");

    cy.get("@row")
      .find("td[data-label='File name']")
      .should("contain", "partially_valid_application_rows.csv");
    cy.get("@row")
      .find("td[data-label='Status']")
      .should("contain", "Completed");
    cy.get("@row").find("td[data-label='Accepted']").should("contain", "2");
    cy.get("@row").find("td[data-label='Rejected']").should("contain", "1");

    // Verify error report
    cy.get(".pf-c-table").pf4_table_action_select(0, "View error report");


    cy.get(".pf-c-table").pf4_table_rows().eq(0).as("row");
    cy.get("@row")
      .find("td[data-label='Application']")
      .should("contain", "application-c");
    cy.get("@row")
      .find("td[data-label='Message']")
      .should("contain", "Business Service: service-x does not exist");
  });
});
