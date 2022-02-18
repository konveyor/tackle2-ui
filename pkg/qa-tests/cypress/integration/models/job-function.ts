import {
  submitForm,
  verifyInitialFormStatus,
  applyFilterTextToolbar,
} from "./commons";

export interface IFormValue {
  name: string;
}

export class JobFunctionsPage {
  openPage(): void {
    // Interceptors
    cy.intercept("GET", "/api/controls/job-function*").as("getJobFunctions");
    
    cy.intercept("POST", "/api/controls/job-function*").as("postJobFunction");
    cy.intercept("PUT", "/api/controls/job-function/*").as("putJobFunction");
    cy.intercept("DELETE", "/api/controls/job-function/*").as(
      "deleteJobFunction"
    );

    // Open page
    cy.visit("/controls/job-functions");
    cy.wait("@getJobFunctions");
  }

  protected fillForm(formValue: IFormValue): void {
    cy.get("input[name='name']").clear().type(formValue.name);
  }

  create(formValue: IFormValue): void {
    this.openPage();

    cy.get("button[aria-label='create-job-function']").click();

    verifyInitialFormStatus();
    this.fillForm(formValue);
    submitForm();

    cy.wait("@postJobFunction");
    cy.wait("@getJobFunctions");
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

    cy.wait("@putJobFunction");
    cy.wait("@getJobFunctions");
  }

  delete(rowIndex: number): void {
    this.openPage();

    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(rowIndex)
      .find("button[aria-label='delete']")
      .click();
    cy.get("button[aria-label='confirm']").click();

    cy.wait("@deleteJobFunction");
    cy.wait("@getJobFunctions");
  }

  applyFilter(filterIndex: number, filterText: string): void {
    applyFilterTextToolbar(filterIndex, filterText);
    cy.wait("@getJobFunctions");
  }

  toggleSortBy(columnName: string): void {
    cy.get(".pf-c-table").pf4_table_column_toggle(columnName);
    cy.wait("@getJobFunctions");
  }
}
