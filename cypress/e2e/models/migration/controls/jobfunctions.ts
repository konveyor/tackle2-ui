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
  inputText,
  notExists,
  performRowActionByIcon,
  selectItemsPerPage,
  selectUserPerspective,
  submitForm,
} from "../../../../utils/utils";
import {
  SEC,
  button,
  controls,
  createNewButton,
  deleteAction,
  jobFunctions,
  migration,
} from "../../../types/constants";
import * as commonView from "../../../views/common.view";
import { jobfunctionNameInput } from "../../../views/jobfunctions.view";
import { navMenu, navTab } from "../../../views/menu.view";

export class Jobfunctions {
  name: string;
  id?: number;
  static fullUrl = Cypress.config("baseUrl") + "/controls/job-functions";

  constructor(name: string, id?: number) {
    this.name = name;
    this.id = id;
  }

  /** Create a job function via the API (no UI interaction). */
  static createViaApi(
    name: string,
    headers?: Record<string, string>
  ): Cypress.Chainable<Jobfunctions> {
    return cy
      .request({
        method: "POST",
        url: "/hub/jobfunctions",
        body: { name },
        ...(headers && { headers }),
      })
      .then((res) => new Jobfunctions(res.body.name, res.body.id));
  }

  /** Delete a job function via the API (no UI interaction). */
  deleteViaApi(headers?: Record<string, string>): void {
    if (this.id) {
      cy.request({
        method: "DELETE",
        url: `/hub/jobfunctions/${this.id}`,
        ...(headers && { headers }),
        failOnStatusCode: false,
      });
    }
  }

  /** Delete all job functions via the API. */
  static deleteAllViaApi(headers?: Record<string, string>): void {
    cy.request({
      method: "GET",
      url: "/hub/jobfunctions",
      ...(headers && { headers }),
    }).then((res) => {
      const items = Array.isArray(res.body) ? res.body : [];
      items.forEach((jf: { id: number }) => {
        cy.request({
          method: "DELETE",
          url: `/hub/jobfunctions/${jf.id}`,
          ...(headers && { headers }),
          failOnStatusCode: false,
        });
      });
    });
  }

  public static openList(itemsPerPage = 100): void {
    cy.url().then(($url) => {
      if (!$url.includes("/controls/job-functions")) {
        selectUserPerspective(migration);
        clickByText(navMenu, controls);
        cy.get("h1", { timeout: 60 * SEC }).should("contain", "Controls");
        clickByText(navTab, jobFunctions);
      }
    });
    selectItemsPerPage(itemsPerPage);
  }

  protected fillName(name: string): void {
    inputText(jobfunctionNameInput, name);
  }

  create(cancel = false): void {
    cy.intercept("POST", "/hub/jobfunctions*").as("postJobfunction");
    Jobfunctions.openList();
    clickByText(button, createNewButton);
    if (cancel) {
      cancelForm();
    } else {
      this.fillName(this.name);
      submitForm();
      cy.wait("@postJobfunction");
    }
  }

  edit(updatedName: string, cancel = false): void {
    Jobfunctions.openList();
    performRowActionByIcon(this.name, commonView.pencilIcon);

    if (cancel) {
      cancelForm();
    } else {
      if (updatedName != this.name) {
        cy.intercept("PUT", "/hub/jobfunctions/*").as("putJobfunction");
        this.fillName(updatedName);
        this.name = updatedName;
        submitForm();
        cy.wait("@putJobfunction");
      }
    }
  }

  delete(cancel = false): void {
    Jobfunctions.openList();
    cy.intercept("DELETE", "/hub/jobfunctions/*").as("deleteJobfunction");
    clickItemInKebabMenu(this.name, deleteAction);
    if (cancel) {
      click(commonView.confirmCancelButton);
    } else {
      click(commonView.confirmButton);
      cy.wait("@deleteJobfunction");
      notExists(this.name);
    }
  }
}
