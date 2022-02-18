/// <reference types="cypress" />
/// <reference types="cypress-keycloak-commands" />

import { ApplicationPage } from "../../models/application";
import { TagTypePage } from "../../models/tag-type";

// https://issues.redhat.com/browse/TACKLE-228
describe("Tag count in application inventory is updated if a linked tag is deleted", () => {
  const application = new ApplicationPage();
  const tagType = new TagTypePage();

  beforeEach(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.api_clean(tokens, "TagType");
      cy.api_clean(tokens, "Application");

      const tagTypes = [];
      cy.log("")
        .then(() => {
          // Create tag types
          return [...Array(2)]
            .map((_, i) => ({
              name: `tagType-${(i + 10).toString(36)}`,
            }))
            .forEach((payload) => {
              cy.api_crud(tokens, "TagType", "POST", payload).then((data) => {
                tagTypes.push(data);
              });
            });
        })
        .then(() => {
          // Create tags
          return [...Array(2)]
            .map((_, i) => {
              return [
                {
                  name: `tag-a-${(i + 10).toString(36)}`,
                  tagType: tagTypes[i],
                },
                {
                  name: `tag-b-${(i + 10).toString(36)}`,
                  tagType: tagTypes[i],
                },
              ];
            })
            .flatMap((a) => a)
            .forEach((payload) => {
              cy.api_crud(tokens, "Tag", "POST", payload);
            });
        });
    });
  });

  it("Application's linked tag is deleted => application inventory shows correct data", () => {
    application.create({
      name: "myApplication",
      tags: ["tag-a-a", "tag-b-a", "tag-a-b"],
    });

    // Verify table
    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .find("td[data-label='Tag count']")
      .should("contain", "3");

    cy.get(".pf-c-table").pf4_table_row_expand(0);
    cy.get(".pf-c-table > tbody > tr.pf-c-table__expandable-row")
      .find(".pf-c-description-list .pf-c-label")
      .should("contain", "tag-a-a")
      .should("contain", "tag-b-a")
      .should("contain", "tag-a-b");

    // Delete linked tags
    tagType.deleteTag(0, 1);
    tagType.deleteTag(1, 0);

    // Verify table
    application.openPage();

    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .find("td[data-label='Tag count']")
      .should("contain", "1");

    cy.get(".pf-c-table").pf4_table_row_expand(0);
    cy.get(".pf-c-table > tbody > tr.pf-c-table__expandable-row")
      .find(".pf-c-description-list .pf-c-label")
      .should("contain", "tag-a-a");
  });

  it("Application's linked tagType is deleted => application inventory shows correct data", () => {
    application.create({
      name: "myApplication",
      tags: ["tag-a-a", "tag-b-a", "tag-a-b"],
    });

    // Verify table
    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .find("td[data-label='Tag count']")
      .should("contain", "3");

    cy.get(".pf-c-table").pf4_table_row_expand(0);
    cy.get(".pf-c-table > tbody > tr.pf-c-table__expandable-row")
      .find(".pf-c-description-list .pf-c-label")
      .should("contain", "tag-a-a")
      .should("contain", "tag-b-a")
      .should("contain", "tag-a-b");

    // Delete linked tagType
    tagType.deleteTagType(0);

    // Verify table
    application.openPage();

    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .find("td[data-label='Tag count']")
      .should("contain", "1");

    cy.get(".pf-c-table").pf4_table_row_expand(0);
    cy.get(".pf-c-table > tbody > tr.pf-c-table__expandable-row")
      .find(".pf-c-description-list .pf-c-label")
      .should("contain", "tag-a-b");
  });
});
