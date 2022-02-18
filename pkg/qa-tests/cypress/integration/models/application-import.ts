import { applyFilterTextToolbar } from "./commons";

export interface IFormValue {
  fileName: string;
}

export class ApplicationImportPage {
  openPage(): void {
    // Interceptors
    cy.intercept("GET", "/api/application-inventory/import-summary*").as(
      "getImportSummaries"
    );
    cy.intercept("POST", "/api/application-inventory/file/upload").as(
      "postImportSummary"
    );
    cy.intercept("DELETE", "/api/application-inventory/import-summary/*").as(
      "deleteImportSummary"
    );

    // Open page
    cy.visit("/applications/application-imports");
    cy.wait("@getImportSummaries");
  }

  protected fillForm(formValue: IFormValue): void {
    cy.get("input[type='file']").attachFile(formValue.fileName, {
      subjectType: "drag-n-drop",
    });
  }

  protected verifyInitialFormStatus(): void {
    cy.get("form.pf-c-form button.pf-m-primary")
      .contains("Import")
      .should("be.disabled");
  }

  protected submitImportForm = () => {
    cy.get("form.pf-c-form button.pf-m-primary")
      .contains("Import")
      .should("not.be.disabled")
      .click({ force: true });
  };

  create(formValue: IFormValue, openPage: boolean = true): void {
    if (openPage) {
      this.openPage();
    }

    cy.get("button[aria-label='import-applications']").click();

    this.verifyInitialFormStatus();
    this.fillForm(formValue);
    this.submitImportForm();

    cy.wait("@postImportSummary");
    cy.wait("@getImportSummaries");
  }

  delete(rowIndex: number): void {
    cy.get(".pf-c-table").pf4_table_action_select(rowIndex, "Delete");
    cy.get("button[aria-label='confirm']").click();
    cy.wait("@deleteImportSummary");
    cy.wait("@getImportSummaries");
  }

  applyFilter(filterIndex: number, filterText: string): void {
    switch (filterIndex) {
      case 0:
        applyFilterTextToolbar(filterIndex, filterText);
        break;
      default:
        break;
    }
    cy.wait("@getImportSummaries");
  }
}
