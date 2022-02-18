/// <reference types="cypress" />
/// <reference types="cypress-keycloak-commands" />

context("Reset table after deletion", () => {
  beforeEach(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.api_clean(tokens);
    });
  });

  it("Stakeholders table", () => {
    const totalRows = 11;
    const rowsPerpage = 10;

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.log("Create table rows").then(() => {
        return [...Array(totalRows)]
          .map((_, i) => ({
            email: `email-${(i + 10).toString(36)}@domain.com`,
            displayName: `stakeholder${i + 1}`,
          }))
          .forEach((payload) => {
            return cy.api_crud(tokens, "Stakeholder", "POST", payload);
          });
      });
    });

    // Go to page
    cy.visit("/controls/stakeholders");

    verifyPagination(
      "controls/stakeholder",
      totalRows,
      rowsPerpage,
      ["email-a@domain.com", "email-j@domain.com"],
      ["email-k@domain.com"]
    );
  });

  it("Stakeholder group table", () => {
    const totalRows = 11;
    const rowsPerpage = 10;

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.log("Create table rows").then(() => {
        return [...Array(totalRows)]
          .map((_, i) => ({
            name: `group-${(i + 10).toString(36)}`,
          }))
          .forEach((payload) => {
            return cy.api_crud(tokens, "StakeholderGroup", "POST", payload);
          });
      });
    });

    // Go to page
    cy.visit("/controls/stakeholder-groups");

    verifyPagination(
      "controls/stakeholder-group",
      totalRows,
      rowsPerpage,
      ["group-a", "group-j"],
      ["group-k"]
    );
  });

  it("Business service table", () => {
    const totalRows = 11;
    const rowsPerpage = 10;

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.log("Create table rows").then(() => {
        return [...Array(totalRows)]
          .map((_, i) => ({
            name: `service-${(i + 10).toString(36)}`,
          }))
          .forEach((payload) => {
            return cy.api_crud(tokens, "BusinessService", "POST", payload);
          });
      });
    });

    // Go to page
    cy.visit("/controls/business-services");

    verifyPagination(
      "controls/business-service",
      totalRows,
      rowsPerpage,
      ["service-a", "service-j"],
      ["service-k"]
    );
  });

  it("Application inventory table", () => {
    const totalRows = 11;
    const rowsPerpage = 10;

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.log("Create table rows").then(() => {
        return [...Array(totalRows)]
          .map((_, i) => ({
            name: `application-${(i + 10).toString(36)}`,
          }))
          .forEach((payload) => {
            return cy.api_crud(tokens, "Application", "POST", payload);
          });
      });
    });

    // Go to page
    cy.visit("/applications");

    verifyPagination(
      "application-inventory/application",
      totalRows,
      rowsPerpage,
      ["application-a", "application-j"],
      ["application-k"]
    );
  });
});

const verifyPagination = (
  apiPath: string,
  total: number,
  perPage: number,
  firstPageElements: string[],
  lastPageElements: string[]
) => {
  cy.intercept({
    method: "GET",
    path: `/api/${apiPath}*`,
  }).as("getTableDataApi");

  cy.wait("@getTableDataApi");

  // Go to last page
  const lastPage = parseInt(`${(total + perPage) / perPage}`);

  cy.get(".pf-c-page__main-section").pf4_pagination_goToPage(lastPage);
  cy.wait("@getTableDataApi");

  for (let i = 0; i < lastPageElements.length; i++) {
    const element = lastPageElements[i];
    cy.get(".pf-c-table > tbody > tr > td").contains(element);
  }

  // Go to first page
  cy.get(".pf-c-page__main-section").pf4_pagination_goToPage(1);
  cy.wait("@getTableDataApi");

  for (let i = 0; i < firstPageElements.length; i++) {
    const element = firstPageElements[i];
    cy.get(".pf-c-table > tbody > tr > td").contains(element);
  }
};
