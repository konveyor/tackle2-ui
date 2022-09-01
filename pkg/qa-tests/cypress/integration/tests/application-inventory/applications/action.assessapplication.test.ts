/// <reference types="cypress" />
/// <reference types="cypress-keycloak-commands" />

import { ApplicationPage } from "../../../models/application";

describe("Assess an application", () => {
  const application = new ApplicationPage();

  beforeEach(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.api_clean(tokens, "Application");

      const applications = [];

      cy.log("")
        .then(() => {
          return [...Array(3)]
            .map((_, i) => ({
              name: `application-${(i + 10).toString(36)}`,
            }))
            .forEach((payload) => {
              cy.api_crud(tokens, "Application", "POST", payload).then(
                (responseData) => applications.push(responseData)
              );
            });
        })
        .then(() => {
          // Create assessment 'InProgress'
          return cy.api_crud(tokens, "Assessment", "POST", {
            applicationId: applications[1].id,
          });
        })
        .then(() => {
          // Create assessment 'Completed'
          return cy
            .api_crud(tokens, "Assessment", "POST", {
              applicationId: applications[2].id,
            })
            .then((responseData) =>
              cy.api_crud(tokens, "Assessment", "PATCH", {
                ...responseData,
                status: "COMPLETE",
              })
            );
        });
    });
  });

  it("Assess application without asessment", () => {
    application.assessApplication(0);
    cy.wait("@postAssessment");

    cy.wait(1000);
    cy.url().should("match", new RegExp("/applications/assessment/*"));
  });

  it("Assess application whose status is 'inProgress'", () => {
    application.assessApplication(1);

    cy.wait(1000);
    cy.url().should("match", new RegExp("/applications/assessment/*"));
  });

  it("Assess application whose status is 'complete'", () => {
    application.assessApplication(2);

    cy.get(".pf-c-modal-box__body").contains(
      "This application has already been assessed. Do you want to continue?"
    );
    cy.get("button[aria-label='confirm']").click();

    cy.wait(1000);
    cy.url().should("match", new RegExp("/applications/assessment/*"));
  });
});
