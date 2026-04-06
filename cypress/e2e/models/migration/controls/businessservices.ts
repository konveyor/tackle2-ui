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
  cancelForm,
  click,
  clickByText,
  clickItemInKebabMenu,
  goToLastPage,
  goToPage,
  inputText,
  notExists,
  performRowActionByIcon,
  selectFormItems,
  selectItemsPerPage,
  selectUserPerspective,
  submitForm,
} from "../../../../utils/utils";
import {
  SEC,
  businessServices,
  button,
  controls,
  createNewButton,
  deleteAction,
  migration,
  trTag,
} from "../../../types/constants";
import {
  businessServiceDescriptionInput,
  businessServiceNameInput,
  businessServiceOwnerSelect,
  buzinessServiceLabels,
} from "../../../views/businessservices.view";
import * as commonView from "../../../views/common.view";
import { navMenu, navTab } from "../../../views/menu.view";

export class BusinessServices {
  name: string;
  description: string;
  owner: string;
  id?: number;

  static fullUrl = Cypress.config("baseUrl") + "/controls/business-services";

  constructor(name: string, description?: string, owner?: string, id?: number) {
    this.name = name;
    if (description) this.description = description;
    if (owner) this.owner = owner;
    this.id = id;
  }

  public static openList(itemsPerPage = 100): void {
    cy.url().then(($url) => {
      if (!$url.includes("/controls/business-services")) {
        selectUserPerspective(migration);
        clickByText(navMenu, controls);
        cy.get("h1", { timeout: 60 * SEC }).should("contain", "Controls");
        clickByText(navTab, businessServices);
      }
    });
    selectItemsPerPage(itemsPerPage);
  }

  // TODO: Refactor this method so that it will return list from particular page or full list, to take into account amount of items per page
  public static getList(amountPerPage = 100, pageNumber?: number) {
    this.openList(amountPerPage);
    if (pageNumber) {
      goToPage(pageNumber);
    }
    return new Promise<BusinessServices[]>((resolve) => {
      const list = [];
      cy.get(commonView.appTable, { timeout: 15 * SEC })
        .find(trTag)
        .each(($row) => {
          const name = $row.find(buzinessServiceLabels.name).text();
          if (name) {
            list.push(new BusinessServices(name));
          }
        })
        .then(() => {
          resolve(list);
        });
    });
  }

  public static getNamesListOnPage(
    amountPerPage = 10,
    pageNumber?: number,
    lastPage = false
  ): Promise<BusinessServices[]> {
    this.openList(amountPerPage);
    if (pageNumber) {
      goToPage(pageNumber);
    } else if (lastPage) {
      goToLastPage();
    }
    return new Promise<BusinessServices[]>((resolve) => {
      const list = [];
      cy.get(commonView.appTable, { timeout: 15 * SEC })
        .find(trTag)
        .each(($row) => {
          const name = $row.find(buzinessServiceLabels.name).text();
          list.push(new BusinessServices(name));
        })
        .then(() => {
          resolve(list);
        });
    });
  }

  protected fillName(name: string): void {
    inputText(businessServiceNameInput, name);
  }

  protected fillDescription(description: string): void {
    inputText(businessServiceDescriptionInput, description);
  }

  protected selectOwner(owner: string): void {
    selectFormItems(businessServiceOwnerSelect, owner);
  }

  create(cancel = false): void {
    cy.intercept("POST", "/hub/businessservices*").as("postBusinessService");
    BusinessServices.openList();
    clickByText(button, createNewButton);
    if (cancel) {
      cancelForm();
    } else {
      this.fillName(this.name);
      if (this.description) {
        this.fillDescription(this.description);
      }
      if (this.owner) {
        this.selectOwner(this.owner);
      }
      submitForm();
      cy.wait("@postBusinessService");
    }
  }

  edit(
    updateValues: {
      name?: string;
      description?: string;
      owner?: string;
    },
    cancel = false
  ): void {
    BusinessServices.openList();
    performRowActionByIcon(this.name, commonView.pencilIcon);

    if (cancel) {
      cancelForm();
    } else {
      let hasChanges = false;
      if (updateValues.name && updateValues.name != this.name) {
        this.fillName(updateValues.name);
        this.name = updateValues.name;
        hasChanges = true;
      }
      if (
        updateValues.description &&
        updateValues.description != this.description
      ) {
        this.fillDescription(updateValues.description);
        this.description = updateValues.description;
        hasChanges = true;
      }
      if (updateValues.owner && updateValues.owner != this.owner) {
        this.selectOwner(updateValues.owner);
        this.owner = updateValues.owner;
        hasChanges = true;
      }
      if (hasChanges) {
        cy.intercept("PUT", "/hub/businessservices/*").as("putBusinessService");
        submitForm();
        cy.wait("@putBusinessService");
      }
    }
  }

  delete(cancel = false): void {
    BusinessServices.openList();
    cy.intercept("DELETE", "/hub/businessservices/*").as(
      "deleteBusinessService"
    );
    clickItemInKebabMenu(this.name, deleteAction);
    if (cancel) {
      click(commonView.confirmCancelButton);
    } else {
      click(commonView.confirmButton);
      cy.wait("@deleteBusinessService");
      notExists(this.name);
    }
  }

  /** Create a business service via the API (no UI interaction). */
  static createViaApi(
    name: string,
    headers?: Record<string, string>
  ): Cypress.Chainable<BusinessServices> {
    return cy
      .request({
        method: "POST",
        url: "/hub/businessservices",
        body: { name },
        ...(headers && { headers }),
      })
      .then(
        (res) =>
          new BusinessServices(
            res.body.name,
            res.body.description,
            undefined,
            res.body.id
          )
      );
  }

  /** Delete a business service via the API (no UI interaction). */
  deleteViaApi(headers?: Record<string, string>): void {
    if (this.id) {
      cy.request({
        method: "DELETE",
        url: `/hub/businessservices/${this.id}`,
        ...(headers && { headers }),
        failOnStatusCode: false,
      });
    }
  }

  /** Delete all business services via the API. */
  static deleteAllViaApi(headers?: Record<string, string>): void {
    cy.request({
      method: "GET",
      url: "/hub/businessservices",
      ...(headers && { headers }),
      failOnStatusCode: false,
    }).then((res) => {
      const body =
        typeof res.body === "string" ? JSON.parse(res.body) : res.body;
      const items = Array.isArray(body) ? body : [];
      items.forEach((bs: { id: number }) => {
        cy.request({
          method: "DELETE",
          url: `/hub/businessservices/${bs.id}`,
          ...(headers && { headers }),
          failOnStatusCode: false,
        });
      });
    });
  }

  /** Create multiple business services via the API. */
  static createMultipleViaApi(
    count: number,
    headers?: Record<string, string>
  ): Cypress.Chainable<BusinessServices[]> {
    const timestamp = Date.now();
    const businessServices: BusinessServices[] = [];
    let chain: Cypress.Chainable<unknown> = cy.wrap(null);

    for (let i = 0; i < count; i++) {
      chain = chain.then(() =>
        BusinessServices.createViaApi(
          `Business Service ${timestamp}-${i}`,
          headers
        ).then((bs) => {
          businessServices.push(bs);
        })
      );
    }

    return chain.then(() => businessServices);
  }
}
