/// <reference types="cypress" />
/// <reference types="cypress-keycloak-commands" />

import { TagTypePage } from "../../../models/tag-type";

describe("Delete tag type", () => {
  const tagType = new TagTypePage();

  beforeEach(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.api_clean(tokens, "TagType");
      cy.api_crud(tokens, "TagType", "POST", {
        name: "tagtype-a",
      });
    });
  });

  it("Delete the only item available", () => {
    tagType.deleteTagType(0);

    // Verify table
    cy.get(
      ".pf-c-empty-state > .pf-c-empty-state__content > .pf-c-title"
    ).contains("No tag types available");
  });
});
