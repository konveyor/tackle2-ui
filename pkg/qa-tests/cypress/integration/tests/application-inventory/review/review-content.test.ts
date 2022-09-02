/// <reference types="cypress" />
/// <reference types="cypress-keycloak-commands" />

import { AssessmentReviewPage } from "../../../models/assessment";

describe("Review content", () => {
  const assessmentReviewPage = new AssessmentReviewPage();

  let application;

  before(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    let assessment;

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.api_clean(tokens, "Application");
      cy.api_clean(tokens, "Stakeholder");

      cy.log("")
        .then(() => {
          // Create application with assessment
          return (
            cy
              // Create application
              .api_crud(tokens, "Application", "POST", {
                name: "application-2",
              })
              .then((responseData) => {
                application = responseData;
              })
              // Create assessment
              .then(() => {
                return cy
                  .api_crud(tokens, "Assessment", "POST", {
                    applicationId: application.id,
                  })
                  .then((responseData) => {
                    assessment = responseData;
                  });
              })
          );
        })
        .then(() => {
          // Create stakeholder for questionnaire
          return cy.api_crud(tokens, "Stakeholder", "POST", {
            email: "email-a@domain.com",
            displayName: "stakeholder-a",
          });
        })
        .then(() => {
          assessmentReviewPage.fillQuestionnaire(assessment.id, {
            stakeholders: ["stakeholder-a"],
            stakeholderGroups: [],
            categories: [
              { answerIndex: 0 },
              { answerIndex: 1 },
              { answerIndex: 2 },
              { answerIndex: 3 },
              { answerIndex: 4 },
            ],
          });

          cy.wait(2000);
        });
    });
  });

  beforeEach(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    assessmentReviewPage.openReviewPage(application.id);
  });

  it("Donut chart", () => {
    cy.get(".pf-c-chart").should("have.length", 1);

    cy.get("tspan")
      .should("contain", "Low: 3")
      .should("contain", "Medium: 9")
      .should("contain", "High: 9")
      .should("contain", "Unknown: 7");
  });

  it("Assessment summary: Sort by risk", () => {
    // Sort by risk Asc
    cy.get(".pf-c-table").pf4_table_column_toggle("Risk");
    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("Low");
    cy.get(".pf-c-table").pf4_table_rows().eq(9).contains("Medium");

    // Sort by risk Desc
    cy.get(".pf-c-table").pf4_table_column_toggle("Risk");
    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("Unknown");
    cy.get(".pf-c-table").pf4_table_rows().eq(9).contains("High");
  });

  it("Assessment summary: Filter by risk", () => {
    // Filter "Low"
    cy.get(
      ".pf-c-toolbar .pf-c-select > .pf-c-select__toggle > button"
    ).click();
    cy.get(
      ".pf-c-toolbar .pf-c-select > .pf-c-select__menu > .pf-c-form__fieldset > .pf-c-select__menu-search > input"
    ).type("Low");
    cy.get(
      ".pf-c-toolbar .pf-c-select > .pf-c-select__menu > .pf-c-form__fieldset > .pf-c-select__menu-item > input"
    ).check();

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("Low");
    cy.get("button.pf-m-link")
      .contains("Clear all filters")
      .click({ force: true });

    // Filter "High"
    cy.get(
      ".pf-c-toolbar .pf-c-select > .pf-c-select__toggle > button"
    ).click();
    cy.get(
      ".pf-c-toolbar .pf-c-select > .pf-c-select__menu > .pf-c-form__fieldset > .pf-c-select__menu-search > input"
    ).type("High");
    cy.get(
      ".pf-c-toolbar .pf-c-select > .pf-c-select__menu > .pf-c-form__fieldset > .pf-c-select__menu-item > input"
    ).check();

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("High");
  });

  it("Form: submit review", () => {
    cy.get("button[aria-label='submit']").should("be.disabled");

    // Fill form
    cy.get(".pf-c-form__group-control input.pf-c-select__toggle-typeahead")
      .eq(0)
      .type("rehost")
      .type("{enter}");
    cy.get(".pf-c-form__group-control input.pf-c-select__toggle-typeahead")
      .eq(1)
      .type("large")
      .type("{enter}");

    cy.get("input[aria-label='criticality']").clear().type("3");
    cy.get("input[aria-label='priority']").clear().type("5");

    cy.get("button[aria-label='submit']").should("not.be.disabled");
    cy.get("form").submit();

    // verify
    cy.wait("@postReview");
    // cy.wait(500);
    cy.wait("@getApplications");
    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .find("td[data-label='Review']")
      .contains("Completed");
  });
});
