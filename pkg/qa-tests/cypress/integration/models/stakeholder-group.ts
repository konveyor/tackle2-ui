import {
  applyFilterTextToolbar,
  submitForm,
  verifyInitialFormStatus,
} from "./commons";

export interface IFormValue {
  name: string;
  description?: string;
  members?: string[];
}

export class StakeholderGroupPage {
  openPage(): void {
    // Interceptors
    cy.intercept("GET", "/api/controls/stakeholder-group*").as(
      "getStakeholderGroups"
    );
    cy.intercept("POST", "/api/controls/stakeholder-group*").as(
      "postStakeholderGroup"
    );
    cy.intercept("PUT", "/api/controls/stakeholder-group/*").as(
      "putStakeholderGroup"
    );
    cy.intercept("DELETE", "/api/controls/stakeholder-group/*").as(
      "deleteStakeholderGroup"
    );

    cy.intercept("GET", "/api/controls/stakeholder*").as("getStakeholders");

    // Open page
    cy.visit("/controls/stakeholder-groups");
    cy.wait("@getStakeholderGroups");
  }

  protected fillForm(formValue: IFormValue): void {
    cy.get("input[name='name']").clear().type(formValue.name);

    if (formValue.description) {
      cy.get("textarea[name='description']")
        .clear()
        .type(formValue.description);
    }
    if (formValue.members) {
      cy.wait("@getStakeholders");
      formValue.members.forEach((e) => {
        cy.get("input[aria-label='stakeholders']")
          .clear()
          .type(e)
          .type("{enter}");
      });
    }
  }

  create(formValue: IFormValue): void {
    this.openPage();

    cy.get("button[aria-label='create-stakeholder-group']").click();

    verifyInitialFormStatus();
    this.fillForm(formValue);
    submitForm();

    cy.wait("@postStakeholderGroup");
    cy.wait("@getStakeholderGroups");
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

    cy.wait("@putStakeholderGroup");
    cy.wait("@getStakeholderGroups");
  }

  delete(rowIndex: number): void {
    this.openPage();

    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(rowIndex)
      .find("button[aria-label='delete']")
      .click();
    cy.get("button[aria-label='confirm']").click();

    cy.wait("@deleteStakeholderGroup");
    cy.wait("@getStakeholderGroups");
  }

  applyFilter(filterIndex: number, filterText: string): void {
    applyFilterTextToolbar(filterIndex, filterText);
    cy.wait("@getStakeholderGroups");
  }

  toggleSortBy(columnName: string): void {
    cy.get(".pf-c-table").pf4_table_column_toggle(columnName);
    cy.wait("@getStakeholderGroups");
  }
}
