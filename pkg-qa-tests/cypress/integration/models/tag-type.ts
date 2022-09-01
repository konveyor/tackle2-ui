import {
  applyFilterTextToolbar,
  submitForm,
  verifyInitialFormStatus,
} from "./commons";

export interface ITagTypeFormValue {
  name: string;
  rank: number;
  color?: string;
}

export interface ITagFormValue {
  name: string;
  tagType?: string;
}

export class TagTypePage {
  openPage(): void {
    // Interceptors
    cy.intercept("GET", "/api/controls/tag-type*").as("getTagTypes");

    cy.intercept("POST", "/api/controls/tag-type*").as("postTagType");
    cy.intercept("PUT", "/api/controls/tag-type/*").as("putTagType");
    cy.intercept("DELETE", "/api/controls/tag-type/*").as("deleteTagType");

    cy.intercept("POST", "/api/controls/tag*").as("postTag");
    cy.intercept("PUT", "/api/controls/tag/*").as("putTag");
    cy.intercept("DELETE", "/api/controls/tag/*").as("deleteTag");

    // Open page
    cy.visit("/controls/tags");
    cy.wait("@getTagTypes");
  }

  protected fillTagTypeForm(formValue: ITagTypeFormValue): void {
    cy.get("input[name='name']").clear().type(formValue.name);
    cy.get("input[name='rank']").clear().type(`${formValue.rank}`);

    if (formValue.color) {
      cy.get(
        "button[aria-label='Options menu'].pf-c-select__toggle-button"
      ).click();
      cy.get("ul[aria-label='color'].pf-c-select__menu > li > button")
        .contains(formValue.color)
        .click();
    }
  }

  protected fillTagForm(formValue: ITagFormValue): void {
    cy.get("input[name='name']").clear().type(formValue.name);

    if (formValue.tagType) {
      cy.get(
        "button[aria-label='Options menu'].pf-c-select__toggle-button"
      ).click();
      cy.get("ul[aria-label='tag-type'].pf-c-select__menu > li > button")
        .contains(formValue.tagType)
        .click();
    }
  }

  createTagType(formValue: ITagTypeFormValue): void {
    this.openPage();

    cy.get("button[aria-label='create-tag-type']").click();

    verifyInitialFormStatus();
    this.fillTagTypeForm(formValue);
    submitForm();

    cy.wait("@postTagType");
    cy.wait("@getTagTypes");
  }

  createTag(formValue: ITagFormValue): void {
    this.openPage();

    cy.get("button[aria-label='create-tag']").click();

    verifyInitialFormStatus();
    this.fillTagForm(formValue);
    submitForm();

    cy.wait("@postTag");
    cy.wait("@getTagTypes");
  }

  editTagType(rowIndex: number, formValue: ITagTypeFormValue): void {
    this.openPage();

    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(rowIndex)
      .find("button[aria-label='edit']")
      .click();

    verifyInitialFormStatus();
    this.fillTagTypeForm(formValue);
    submitForm();

    cy.wait("@putTagType");
    cy.wait("@getTagTypes");
  }

  editTag(
    tagTypeRowIndex: number,
    tagRowIndex: number,
    formValue: ITagFormValue
  ): void {
    this.openPage();

    cy.get(".pf-c-table").pf4_table_row_expand(tagTypeRowIndex);
    cy.get(
      ".pf-c-table__expandable-row-content > div > .pf-c-table"
    ).pf4_table_action_select(tagRowIndex, "Edit");

    verifyInitialFormStatus();
    this.fillTagForm(formValue);
    submitForm();

    cy.wait("@putTag");
    cy.wait("@getTagTypes");
  }

  deleteTagType(rowIndex: number): void {
    this.openPage();

    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(rowIndex)
      .find("button[aria-label='delete']")
      .click();
    cy.get("button[aria-label='confirm']").click();

    cy.wait("@deleteTagType");
    cy.wait("@getTagTypes");
  }

  deleteTag(tagTypeRowIndex: number, tagRowIndex: number): void {
    this.openPage();

    cy.get(".pf-c-table").pf4_table_row_expand(tagTypeRowIndex);
    cy.get(
      ".pf-c-table__expandable-row-content > div > .pf-c-table"
    ).pf4_table_action_select(tagRowIndex, "Delete");

    cy.get("button[aria-label='confirm']").click();

    cy.wait("@deleteTag");
    cy.wait("@getTagTypes");
  }

  applyFilter(filterIndex: number, filterText: string): void {
    applyFilterTextToolbar(filterIndex, filterText);
    cy.wait("@getTagTypes");
  }

  toggleSortBy(columnName: string): void {
    cy.get(".pf-c-table").pf4_table_column_toggle(columnName);
    cy.wait("@getTagTypes");
  }
}
