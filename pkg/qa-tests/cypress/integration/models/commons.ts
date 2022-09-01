export const verifyInitialFormStatus = () => {
  cy.get("button[aria-label='submit']").should("be.disabled");
};

export const submitForm = () => {
  cy.get("button[aria-label='submit']").should("not.be.disabled");
  cy.get("form").submit();
};

export const selectFilterToolbar = (filterIndex: number) => {
  // Select filter
  cy.get(".pf-c-toolbar .pf-c-dropdown").first().pf4_dropdown("toggle");
  cy.get(".pf-c-toolbar .pf-c-dropdown")
    .first()
    .pf4_dropdown("select", filterIndex)
    .click();
};

export const applyFilterTextToolbar = (
  filterIndex: number,
  filterText: string
) => {
  // Select filter
  selectFilterToolbar(filterIndex);

  // Type filterText and then apply it
  cy.get(".pf-c-toolbar .pf-c-toolbar__content input[aria-label='filter-text']")
    .clear()
    .type(filterText);
  cy.get(
    ".pf-c-toolbar .pf-c-toolbar__content button[aria-label='search']"
  ).click();
};

export const applyCheckboxFilterToolbar = (filterText: string) => {
  // Apply filter
  cy.get(
    ".pf-c-toolbar .pf-c-select > .pf-c-select__toggle > button.pf-c-select__toggle-button"
  ).click();
  cy.get(
    ".pf-c-toolbar .pf-c-select > .pf-c-select__menu > .pf-c-form__fieldset > .pf-c-select__menu-search > input"
  ).type(filterText);
  cy.get(
    ".pf-c-toolbar .pf-c-select > .pf-c-select__menu > .pf-c-form__fieldset > .pf-c-select__menu-item > input"
  ).check();
};
