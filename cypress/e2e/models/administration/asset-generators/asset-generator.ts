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
import { Generator } from "../../../../../client/src/app/api/models";
import {
  AssetGeneratorData,
  GeneratorRepository,
} from "../../../../e2e/types/types";
import {
  cancelForm,
  click,
  clickByText,
  inputText,
  performRowActionByIcon,
  selectFormItems,
  selectItemsPerPage,
  selectUserPerspective,
  submitForm,
} from "../../../../utils/utils";
import { SEC, administration, itemsPerPage } from "../../../types/constants";
import {
  GeneratorView,
  generatorsMenu,
} from "../../../views/asset-generators.view";
import { confirmButton, pencilAction } from "../../../views/common.view";
import { navMenu } from "../../../views/menu.view";

export class AssetGenerator implements Omit<Generator, "id"> {
  name: string;
  kind: string;
  description?: string;
  repository: GeneratorRepository;

  constructor(assetGeneratorData: AssetGeneratorData) {
    this.name = assetGeneratorData.name;
    this.kind = assetGeneratorData.kind;
    this.description = assetGeneratorData.description;
    this.repository = assetGeneratorData.repository;
  }

  static fullUrl = Cypress.config("baseUrl") + "/asset-generators";

  public static open(forceReload = false) {
    if (forceReload) {
      cy.visit(AssetGenerator.fullUrl, { timeout: 15 * SEC }).then((_) => {
        cy.get("h1", { timeout: 35 * SEC }).should("contain", generatorsMenu);
        selectItemsPerPage(itemsPerPage);
      });
      return;
    }

    cy.url().then(($url) => {
      if (!$url.includes(AssetGenerator.fullUrl)) {
        selectUserPerspective(administration);
        clickByText(navMenu, generatorsMenu);
        cy.get("h1", { timeout: 60 * SEC }).should("contain", generatorsMenu);
      }
      selectItemsPerPage(itemsPerPage);
    });
  }

  protected fillName(name: string): void {
    inputText(GeneratorView.nameInput, name);
  }

  protected fillDescription(description: string): void {
    inputText(GeneratorView.descriptionInput, description);
  }

  protected selectGeneratorKind(kind: string): void {
    selectFormItems(GeneratorView.generatorTypeSelect, kind);
  }

  protected fillRepository(repository: GeneratorRepository): void {
    selectFormItems(GeneratorView.repositoryTypeButton, repository.kind);
    inputText(GeneratorView.repositoryUrlInput, repository.url);

    if (repository.branch) {
      inputText(GeneratorView.repositoryBranchInput, repository.branch);
    }
    if (repository.path) {
      inputText(GeneratorView.repositoryRootPathInput, repository.path);
    }
  }

  private applyFormValues(values: Partial<AssetGeneratorData>): void {
    if (values.name) this.fillName(values.name);
    if (values.description) this.fillDescription(values.description);
    if (values.kind) this.selectGeneratorKind(values.kind);
    if (values.repository) this.fillRepository(values.repository);
  }

  create(cancel = false): void {
    AssetGenerator.open();
    cy.get(GeneratorView.createNewButton).should("be.visible").click();
    if (cancel) {
      cancelForm();
      return;
    }
    this.applyFormValues(this as Partial<AssetGeneratorData>);
    submitForm();
  }

  delete(cancel = false): void {
    AssetGenerator.open();
    performRowActionByIcon(this.name, GeneratorView.deleteAction);
    if (cancel) {
      cancelForm();
    } else click(confirmButton);
  }

  edit(updatedValues: Partial<AssetGeneratorData>, cancel = false): void {
    AssetGenerator.open();
    performRowActionByIcon(this.name, pencilAction);

    if (cancel) {
      cancelForm();
      return;
    }

    this.applyFormValues(updatedValues);
    Object.assign(this, updatedValues);
    if (Object.keys(updatedValues).length > 0) {
      submitForm();
    }
  }
}
