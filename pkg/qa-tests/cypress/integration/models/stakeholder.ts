import {
  applyFilterTextToolbar,
  submitForm,
  verifyInitialFormStatus,
} from "./commons";

export interface IFormValue {
  email: string;
  displayName: string;
  jobFunction?: string;
  groups?: string[];
}

export class StakeholderPage {
  openPage(): void {
    // Interceptors
    cy.intercept("GET", "/api/controls/stakeholder*").as("getStakeholders");

    cy.intercept("POST", "/api/controls/stakeholder*").as("postStakeholder");
    cy.intercept("PUT", "/api/controls/stakeholder/*").as("putStakeholder");
    cy.intercept("DELETE", "/api/controls/stakeholder/*").as(
      "deleteStakeholder"
    );

    cy.intercept("GET", "/api/controls/job-function*").as("getJobFunctions");
    cy.intercept("GET", "/api/controls/stakeholder-group*").as(
      "getStakeholderGroups"
    );

    // Open page
    cy.visit("/controls/stakeholders");
    cy.wait("@getStakeholders");
  }

  protected fillForm(formValue: IFormValue): void {
    cy.get("input[name='email']").clear().type(formValue.email);
    cy.get("input[name='displayName']").clear().type(formValue.displayName);

    if (formValue.jobFunction) {
      cy.wait("@getJobFunctions");
      cy.get("input[aria-label='job-function']")
        .clear()
        .type(formValue.jobFunction)
        .type("{enter}");
    }
    if (formValue.groups) {
      cy.wait("@getStakeholderGroups");
      formValue.groups.forEach((e) => {
        cy.get("input[aria-label='stakeholder-groups']")
          .clear()
          .type(e)
          .type("{enter}");
      });
    }
  }

  create(formValue: IFormValue): void {
    this.openPage();

    cy.get("button[aria-label='create-stakeholder']").click();

    verifyInitialFormStatus();
    this.fillForm(formValue);
    submitForm();

    cy.wait("@postStakeholder");
    cy.wait("@getStakeholders");
  }

  edit(rowIndex: number, formValue: IFormValue): void {
    this.openPage();

    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(rowIndex)
      .find("button[aria-label='edit']")
      .click();

    verifyInitialFormStatus();
    this.fillForm(formValue);
    submitForm();

    cy.wait("@putStakeholder");
    cy.wait("@getStakeholders");
  }

  delete(rowIndex: number): void {
    this.openPage();

    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(rowIndex)
      .find("button[aria-label='delete']")
      .click();
    cy.get("button[aria-label='confirm']").click();

    cy.wait("@deleteStakeholder");
    cy.wait("@getStakeholders");
  }

  applyFilter(filterIndex: number, filterText: string): void {
    applyFilterTextToolbar(filterIndex, filterText);
    cy.wait("@getStakeholders");
  }

  toggleSortBy(columnName: string): void {
    cy.get(".pf-c-table").pf4_table_column_toggle(columnName);
    cy.wait("@getStakeholders");
  }
}
