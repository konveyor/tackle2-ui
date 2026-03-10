/*
Copyright © 2021 the Konveyor Contributors (https://konveyor.io/)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import {
  applyAction,
  cancelForm,
  click,
  clickByText,
  closeRowDetails,
  closeSuccessAlert,
  confirm,
  expandRowDetails,
  inputText,
  performRowActionByIcon,
  selectItemsPerPage,
  selectUserPerspective,
  submitForm,
} from "../../../../utils/utils";
import {
  SEC,
  button,
  controls,
  deleteAction,
  migration,
  tags,
  tdTag,
  trTag,
} from "../../../types/constants";
import * as commonView from "../../../views/common.view";
import { navMenu, navTab } from "../../../views/menu.view";
import {
  createTagButton,
  dropdownMenuToggle,
  nameInput,
  tagMenuButton,
} from "../../../views/tags.view";

import { TagCategory } from "./tagcategory";

export function clickTags(): void {
  clickByText(navMenu, controls);
  clickByText(navTab, tags);
}

export function fillName(name: string): void {
  inputText(nameInput, name);
}

export class Tag {
  name: string;
  tagCategory: string;
  id?: number;

  constructor(name: string, tagCategory: string, id?: number) {
    this.name = name;
    this.tagCategory = tagCategory;
    if (id) this.id = id;
  }

  static fullUrl = Cypress.config("baseUrl") + "/controls/tags";

  static openList(itemsPerPage = 100): void {
    cy.url().then(($url) => {
      if ($url != Tag.fullUrl) {
        selectUserPerspective(migration);
        clickByText(navMenu, controls);
        cy.get("h1", { timeout: 60 * SEC }).should("contain", "Controls");
        clickByText(navTab, tags);
      }
    });
    selectItemsPerPage(itemsPerPage);
  }

  protected selectTagCategory(tagCategory: string): void {
    click(dropdownMenuToggle);
    clickByText(button, tagCategory);
  }

  protected clickTagAction(buttonName: string): void {
    // Performs action (edit and delete only) by clicking tag options menu for a specific tag
    cy.contains(tdTag, this.tagCategory)
      .closest(trTag)
      .next()
      .find(tdTag)
      .contains(this.name)
      .closest(trTag)
      .find(tagMenuButton)
      .click()
      .next()
      .contains(button, buttonName)
      .click();
  }

  create(cancel = false, readSuccessAlert = false): void {
    Tag.openList();
    clickByText(button, createTagButton);
    if (cancel) {
      cancelForm();
    } else {
      fillName(this.name);
      this.selectTagCategory(this.tagCategory);
      submitForm();
      if (!readSuccessAlert) closeSuccessAlert();
    }
  }

  edit(
    updatedValue: { name?: string; tagcategory?: string },
    cancel = false
  ): void {
    Tag.openList();
    expandRowDetails(this.tagCategory);
    performRowActionByIcon(this.name, commonView.pencilIcon);
    if (cancel) {
      cancelForm();
    } else {
      if (updatedValue.name && updatedValue.name != this.name) {
        fillName(updatedValue.name);
        this.name = updatedValue.name;
      }
      if (
        updatedValue.tagcategory &&
        updatedValue.tagcategory != this.tagCategory
      ) {
        this.selectTagCategory(updatedValue.tagcategory);
        this.tagCategory = updatedValue.tagcategory;
      }
      if (updatedValue) submitForm();
    }
    closeRowDetails(this.tagCategory);
  }

  delete(cancel = false): void {
    Tag.openList();
    cy.intercept("DELETE", "/hub/tags/*").as("deleteTag");
    expandRowDetails(this.tagCategory);
    applyAction(this.name, deleteAction);
    if (cancel) {
      click(commonView.confirmCancelButton);
    } else {
      confirm();
      cy.wait("@deleteTag");
    }
  }

  /**
   * Create a tag via the API (no UI interaction).
   * Requires a `tagCategoryId` — the numeric ID of the parent tag category.
   */
  static createViaApi(
    name: string,
    tagCategoryId: number,
    tagCategoryName: string,
    headers?: Record<string, string>
  ): Cypress.Chainable<Tag> {
    return cy
      .request({
        method: "POST",
        url: "/hub/tags",
        body: { name, category: { id: tagCategoryId } },
        ...(headers && { headers }),
      })
      .then((res) => new Tag(res.body.name, tagCategoryName, res.body.id));
  }

  /** Delete a tag via the API (no UI interaction). */
  deleteViaApi(headers?: Record<string, string>): void {
    if (this.id) {
      cy.request({
        method: "DELETE",
        url: `/hub/tags/${this.id}`,
        ...(headers && { headers }),
        failOnStatusCode: false,
      });
    }
  }

  /** Create multiple tags via the API. Each tag gets its own tag category. */
  static createMultipleViaApi(
    count: number,
    headers?: Record<string, string>
  ): Cypress.Chainable<Tag[]> {
    const tags: Tag[] = [];
    const timestamp = Date.now();
    let chain: Cypress.Chainable<any> = cy.wrap(null);

    for (let i = 0; i < count; i++) {
      const color = "#" + Math.floor(Math.random() * 16777215).toString(16);
      chain = chain.then(() =>
        TagCategory.createViaApi(
          `Tag Category ${timestamp}-${i}`,
          color,
          headers
        ).then((category) =>
          Tag.createViaApi(
            `Tag ${timestamp}-${i}`,
            category.id,
            `Tag Category ${timestamp}-${i}`,
            headers
          ).then((tag) => {
            tags.push(tag);
          })
        )
      );
    }

    return chain.then(() => tags);
  }
}
