/// <reference types="cypress" />
/// <reference types="cypress-keycloak-commands" />

import { AssessmentReviewPage } from "../../../models/assessment";

describe("Review", () => {
  const assessmentReviewPage = new AssessmentReviewPage();
  let applicationWithoutAssessment;

  before(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.api_clean(tokens, "Application");
      cy.api_clean(tokens, "Stakeholder");

      cy.log("").then(() => {
        // Create application without assessment
        return cy
          .api_crud(tokens, "Application", "POST", {
            name: "application-1",
          })
          .then((responseData) => {
            applicationWithoutAssessment = responseData;
          });
      });
    });
  });

  beforeEach(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");
  });

  it("Go to review page when application doesn't exists", () => {
    assessmentReviewPage.openReviewPage(123456789);
    cy.get(".pf-c-title").contains("Not available");
  });

  it("Go to review page when application doesn't have assessment", () => {
    assessmentReviewPage.openReviewPage(applicationWithoutAssessment.id);
    cy.get(".pf-c-title").contains("Assessment has not been completed");
  });
});
