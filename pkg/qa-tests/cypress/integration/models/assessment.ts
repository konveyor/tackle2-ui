import { applyFilterTextToolbar } from "./commons";

export interface IFormValue {
  stakeholders: string[];
  stakeholderGroups: string[];
  categories?: {
    answerIndex: number;
    comments?: string;
  }[];
}

export class AssessmentReviewPage {
  openAssessmentPage(assessmentId: number): void {
    // Interceptors
    this.configInterceptors();

    // Open page
    cy.visit(`/applications/assessment/${assessmentId}`);
    cy.wait("@getAssessment");
  }

  openReviewPage(applicationId: number): void {
    // Interceptors
    this.configInterceptors();

    // Open page
    cy.visit(`/applications/application/${applicationId}/review`);
    cy.wait("@getApplication");
  }

  protected configInterceptors(): void {
    cy.intercept("GET", "/api/pathfinder/assessments*").as("getAssessments");
    cy.intercept("GET", "/api/pathfinder/assessments/*").as("getAssessment");
    cy.intercept("PATCH", "/api/pathfinder/assessments/*").as(
      "patchAssessment"
    );

    cy.intercept("GET", "/api/application-inventory/application*").as(
      "getApplications"
    );
    cy.intercept("GET", "/api/application-inventory/application/*").as(
      "getApplication"
    );

    cy.intercept("POST", "/api/application-inventory/review").as("postReview");
  }

  protected verifyInitialFormStatus(): void {
    cy.get(".pf-c-wizard__footer button[cy-data='back']").should("be.disabled");
    cy.get(".pf-c-wizard__footer button[cy-data='next']").should("be.disabled");
  }

  protected submitForm(action: "save" | "saveAndReview"): void {
    switch (action) {
      case "save":
        cy.get(".pf-c-wizard__footer").find("button[cy-data='next']").click();
        break;
      case "saveAndReview":
        cy.get(".pf-c-wizard__footer")
          .find("button[cy-data='save-and-review']")
          .click();
        break;
    }
  }

  protected fillForm(formValue: IFormValue): void {
    formValue.stakeholders.forEach((e) => {
      cy.get("input[aria-label='stakeholders']")
        .clear()
        .type(e)
        .type("{enter}");
    });
    formValue.stakeholderGroups.forEach((e) => {
      cy.get("input[aria-label='stakeholder-groups']")
        .clear()
        .type(e)
        .type("{enter}");
    });

    cy.get(".pf-c-wizard__footer button[cy-data='next']").should(
      "not.be.disabled"
    );
    cy.get(".pf-c-wizard__footer").find("button[cy-data='next']").click();

    // Fill answers
    if (formValue.categories) {
      formValue.categories.forEach((e, index) => {
        // Verify footer buttons initial values
        cy.get(".pf-c-wizard__footer button[cy-data='next']").should(
          "be.disabled"
        );

        // Select answer
        cy.get("div[cy-data='question']").each((question) => {
          cy.wrap(question)
            .find("input[type='radio']")
            .eq(e.answerIndex)
            .check();
        });

        // Fill comments
        if (e.comments) {
          cy.get("textarea[aria-label='comments']").clear().type(e.comments);
        }

        // Verify footer buttons
        cy.get(".pf-c-wizard__footer button[cy-data='next']").should(
          "not.be.disabled"
        );

        // Jump to next step
        if (index < formValue.categories.length - 1) {
          cy.get(".pf-c-wizard__footer")
            .find("button[cy-data='next']")
            .contains("Next")
            .click();
        }
      });
    }
  }

  fillQuestionnaire(assessmentId: number, formValue: IFormValue): void {
    this.openAssessmentPage(assessmentId);

    this.verifyInitialFormStatus();
    this.fillForm(formValue);
    this.submitForm("save");

    cy.wait("@patchAssessment");
  }

  fillQuestionnaireAndReview(
    assessmentId: number,
    formValue: IFormValue
  ): void {
    this.openAssessmentPage(assessmentId);

    this.verifyInitialFormStatus();
    this.fillForm(formValue);
    this.submitForm("saveAndReview");

    cy.wait("@patchAssessment");

    cy.wait("@getAssessments");
    cy.wait("@getApplication");
    cy.wait("@getAssessment");
  }
}
