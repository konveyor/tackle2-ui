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
  click,
  clickByText,
  clickItemInKebabMenu,
  clickKebabMenuOptionArchetype,
  clickWithinByText,
  inputText,
  selectFormItems,
} from "../../../../utils/utils";
import { button } from "../../../types/constants";
import * as commonView from "../../../views/common.view";
import * as view from "../../../views/target-profile.view";

import { Archetype } from "./archetype";

export class TargetProfile {
  name: string;
  generatorList?: string[];
  analysisProfile?: string;

  constructor(
    name: string,
    generatorList?: string[],
    analysisProfile?: string
  ) {
    this.name = name;
    this.generatorList = generatorList;
    this.analysisProfile = analysisProfile;
  }

  open(archetypeName: string) {
    Archetype.open();
    clickKebabMenuOptionArchetype(archetypeName, "Manage target profiles");
  }

  protected fillName(name: string): void {
    inputText(view.targetProfileName, name);
  }

  protected selectAnalysisProfile(analysisProfile: string): void {
    selectFormItems(view.analysisProfileToggle, analysisProfile);
  }

  protected selectGenerators(generatorList: string[]): void {
    generatorList.forEach((generator) => {
      cy.contains(view.generatorListItem, generator)
        .should("exist")
        .click({ force: true });
    });
    cy.get(view.addSelectedItems).click();
  }

  create(archetypeName: string, cancel = false, verifyOnly = false): void {
    this.open(archetypeName);
    cy.contains("button", "Create new target profile")
      .should("be.visible")
      .and("not.be.disabled")
      .click();

    if (cancel) {
      clickByText(button, "Cancel");
      return;
    }

    this.fillName(this.name);

    // Select analysis profile if provided
    if (this.analysisProfile) {
      this.selectAnalysisProfile(this.analysisProfile);
    }

    // Select generators if provided
    if (this.generatorList && this.generatorList.length > 0) {
      this.selectGenerators(this.generatorList);
    }

    if (verifyOnly) {
      this.verifyCreateButtonEnabled();
      clickByText(button, "Cancel");
      return;
    }

    clickWithinByText(commonView.modal, "button", "Create");
  }

  verifyCreateButtonEnabled(): void {
    cy.get(commonView.modal)
      .find("button#submit")
      .should("be.visible")
      .and("be.enabled");
  }

  delete(cancel = false): void {
    clickItemInKebabMenu(this.name, "Delete");
    if (cancel) {
      clickByText(button, "Cancel");
      return;
    }
    click(commonView.confirmButton);
  }
}
