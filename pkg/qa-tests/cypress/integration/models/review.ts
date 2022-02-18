import { IDependencyAction } from "./application";
import {
  applyFilterTextToolbar,
  submitForm,
  verifyInitialFormStatus,
  selectFilterToolbar,
  applyCheckboxFilterToolbar,
} from "./commons";

export interface IFormValue {
  name?: string;
  description?: string;
  businessService?: string;
  tags?: string[];
  comments?: string;
}

export class ReviewPage {
  openPage(applicationId: number): void {
    // Interceptors
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

    // Open page
    cy.visit(`/applications/application/${applicationId}/review`);
    cy.wait("@getApplication");
  }

  protected fillForm(formValue: IFormValue): void {
    if (formValue.name) {
      cy.get("input[name='name']").clear().type(formValue.name);
    }
    if (formValue.description) {
      cy.get("input[name='description']").clear().type(formValue.description);
    }
    if (formValue.businessService) {
      cy.wait("@getBusinessServices");
      cy.get("input[aria-label='business-service']")
        .clear()
        .type(formValue.businessService)
        .type("{enter}");
    }
    if (formValue.tags) {
      cy.wait("@getTagTypes");
      formValue.tags.forEach((e) => {
        cy.get("input[aria-label='tags']").clear().type(e).type("{enter}");
      });
    }
    if (formValue.comments) {
      cy.get("textarea[name='comments']").type(formValue.comments);
    }
  }

  create(formValue: IFormValue): void {
    this.openPage(null);

    cy.get("button[aria-label='create-application']").click();

    verifyInitialFormStatus();
    this.fillForm(formValue);
    submitForm();

    cy.wait("@postApplication");
    cy.wait("@getApplications");
  }

  edit(rowIndex: number, formValue: IFormValue): void {
    this.openPage(null);

    cy.get(".pf-c-table").pf4_table_row_edit(rowIndex, "open");

    verifyInitialFormStatus();
    this.fillForm(formValue);
    submitForm();

    cy.wait("@putApplication");
    cy.wait("@getApplications");
  }

  delete(rowIndex: number): void {
    this.openPage(null);

    cy.get(".pf-c-table").pf4_table_action_select(rowIndex, "Delete");
    cy.get("button[aria-label='confirm']").click();

    cy.wait("@deleteApplication");
    cy.wait("@getApplications");
  }

  applyFilter(filterIndex: number, filterText: string): void {
    switch (filterIndex) {
      case 0:
      case 1:
        applyFilterTextToolbar(filterIndex, filterText);
        break;
      case 2:
        // Reset filter
        selectFilterToolbar(0);

        // Select filter
        selectFilterToolbar(filterIndex);
        cy.wait("@getBusinessServices");

        applyCheckboxFilterToolbar(filterText);
        break;
      case 3:
        // Reset filter
        selectFilterToolbar(0);

        // Select filter
        selectFilterToolbar(filterIndex);
        cy.wait("@getTagTypes");

        applyCheckboxFilterToolbar(filterText);
        break;
      default:
        break;
    }

    cy.wait("@getApplications");
  }

  toggleSortBy(columnName: string): void {
    cy.get(".pf-c-table").pf4_table_column_toggle(columnName);
    cy.wait("@getApplications");
  }

  manageDependencies(rowIndex: number, actions: IDependencyAction[]): void {
    this.openPage(null);

    cy.get(".pf-c-table").pf4_table_action_select(
      rowIndex,
      "Manage dependencies"
    );
    cy.wait("@getApplications");
    cy.wait("@getApplicationDependencies"); // Northbound dependencies
    cy.wait("@getApplicationDependencies"); // Southbound dependencies

    const addDependency = (action: IDependencyAction) => {
      cy.get(".pf-c-form__group-control input.pf-c-select__toggle-typeahead")
        .eq(action.type === "north" ? 0 : 1)
        .type(action.application)
        .type("{enter}");

      if (action.operation === "add") {
        cy.wait("@postApplicationDependency");
      } else {
        cy.wait("@deleteApplicationDependency");
      }
    };

    actions.forEach(addDependency);
  }

  assessApplication(rowIndex: number): void {
    this.openPage(null);

    cy.get(".pf-c-table").pf4_table_row_check(rowIndex);
    cy.get(".pf-c-toolbar button[aria-label='assess-application']").click();

    cy.wait("@getAssessments");
  }
}
