import {
  applyFilterTextToolbar,
  submitForm,
  verifyInitialFormStatus,
} from "./commons";

export interface IFormValue {
  name: string;
  description?: string;
  owner?: string;
}

export class BusinessServicePage {
  openPage(): void {
    // Interceptors
    cy.intercept("GET", "/api/controls/business-service*").as(
      "getBusinessServices"
    );

    cy.intercept("POST", "/api/controls/business-service*").as(
      "postBusinessService"
    );
    cy.intercept("PUT", "/api/controls/business-service/*").as(
      "putBusinessService"
    );
    cy.intercept("DELETE", "/api/controls/business-service/*").as(
      "deleteBusinessService"
    );

    cy.intercept("GET", "/api/controls/stakeholder*").as("getStakeholders");

    // Open page
    cy.visit("/controls/business-services");
    cy.wait("@getBusinessServices");
  }

  protected fillForm(formValue: IFormValue): void {
    cy.get("input[name='name']").clear().type(formValue.name);

    if (formValue.description) {
      cy.get("textarea[name='description']")
        .clear()
        .type(formValue.description);
    }
    if (formValue.owner) {
      cy.wait("@getStakeholders");
      cy.get("input[aria-label='owner']")
        .clear()
        .type(formValue.owner)
        .type("{enter}");
    }
  }

  create(formValue: IFormValue): void {
    this.openPage();

    cy.get("button[aria-label='create-business-service']").click();

    verifyInitialFormStatus();
    this.fillForm(formValue);
    submitForm();

    cy.wait("@postBusinessService");
    cy.wait("@getBusinessServices");
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

    cy.wait("@putBusinessService");
    cy.wait("@getBusinessServices");
  }

  delete(rowIndex: number): void {
    this.openPage();

    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(rowIndex)
      .find("button[aria-label='delete']")
      .click();
    cy.get("button[aria-label='confirm']").click();

    cy.wait("@deleteBusinessService");
    cy.wait("@getBusinessServices");
  }

  applyFilter(filterIndex: number, filterText: string): void {
    applyFilterTextToolbar(filterIndex, filterText);
    cy.wait("@getBusinessServices");
  }

  toggleSortBy(columnName: string): void {
    cy.get(".pf-c-table").pf4_table_column_toggle(columnName);
    cy.wait("@getBusinessServices");
  }
}
