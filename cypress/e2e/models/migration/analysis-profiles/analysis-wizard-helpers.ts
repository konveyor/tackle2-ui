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
  clickWithinByText,
  inputText,
  selectAnalysisMode,
  uploadFile,
} from "../../../../utils/utils";
import {
  Languages,
  RepositoryType,
  SEC,
  button,
  clearAllFilters,
} from "../../../types/constants";
import { RulesRepositoryFields } from "../../../types/types";
import {
  addPackageToExclude,
  addPackageToInclude,
  checkboxInput,
  languageListbox,
  menuListItem,
  ossCheckbox,
  targetCamelSelect,
  targetOpenJDKSelect,
  wizardMainBody,
} from "../../../views/analysis-profile.view";
import {
  addRules,
  analyzeManuallyButton,
  camelToggleButton,
  dropDownMenu,
  enableAutomatedTagging,
  enableTransactionAnalysis,
  enterPackageName,
  enterPackageNameToExclude,
  excludePackagesSwitch,
  languageSelectionDropdown,
  openjdkToggleButton,
} from "../../../views/analysis.view";
import { CustomMigrationTargetView } from "../../../views/custom-migration-target.view";

/**
 * Shared helper class containing common methods used by both Analysis and AnalysisProfile classes
 * for wizard interactions related to analysis configuration.
 */
export class AnalysisWizardHelpers {
  /**
   * Selects source of analysis from dropdown
   * @param source - Source to select (e.g., "Source code", "Binary")
   */
  static selectSourceofAnalysis(source: string): void {
    selectAnalysisMode("#analysis-source-toggle", source);
  }

  /**
   * Selects language for analysis
   * @param language - Language to select
   * @param removePreSelected - If true, clears any pre-selected languages first
   */
  static selectLanguage(language: Languages, removePreSelected = false) {
    cy.wait(2 * SEC);
    if (removePreSelected) {
      cy.get(languageSelectionDropdown).click();
      cy.get(languageListbox)
        .contains("Java")
        .closest(menuListItem)
        .find(checkboxInput)
        .check();
      cy.get(languageSelectionDropdown).click();
      clickWithinByText(wizardMainBody, "button", clearAllFilters);
    }

    cy.get(languageSelectionDropdown).click();

    cy.get(languageListbox)
      .contains(language)
      .closest(menuListItem)
      .find(checkboxInput)
      .check();

    cy.get(languageSelectionDropdown).click();
  }

  /**
   * Selects target platforms for migration
   * @param target - Array of target platforms to select
   */
  static selectTarget(target: string[]): void {
    for (let i = 0; i < target.length; i++) {
      if (["OpenJDK 11", "OpenJDK 17", "OpenJDK 21"].includes(target[i])) {
        click(openjdkToggleButton);
        clickByText(dropDownMenu, target[i]);
        click(targetOpenJDKSelect);
      } else if (["camel:3", "camel:4"].includes(target[i])) {
        click(camelToggleButton);
        clickByText(dropDownMenu, target[i]);
        click(targetCamelSelect);
      } else {
        click(`#target-${target[i].replace(/ /g, "-")}-select`);
      }
    }
  }

  /**
   * Enables transaction analysis if not already enabled
   */
  static enableTransactionAnalysis() {
    cy.get(enableTransactionAnalysis)
      .invoke("is", ":checked")
      .then((checked) => {
        checked
          ? cy.log("Box is already checked")
          : cy.get(enableTransactionAnalysis).check();
      });
  }

  /**
   * Disables automated tagging if currently enabled
   */
  static disableAutomatedTagging() {
    cy.get(enableAutomatedTagging)
      .invoke("is", ":checked")
      .then((checked) => {
        checked
          ? cy.get(enableAutomatedTagging).uncheck()
          : cy.log("Box is already unchecked");
      });
  }

  /**
   * Uploads custom rule files
   * @param customRule - Array of custom rule file paths to upload
   */
  static uploadCustomRule(customRule: string[]) {
    for (let i = 0; i < customRule.length; i++) {
      cy.contains("button", "Add rules", { timeout: 20000 })
        .should("be.enabled")
        .click();
      const folder = customRule[i].split(".").pop();
      uploadFile(`${folder}/${customRule[i]}`);
      cy.wait(2000);
      cy.get("span.pf-v5-c-progress__measure", { timeout: 150000 }).should(
        "contain",
        "100%"
      );
      cy.wait(2000);
      cy.contains(addRules, "Add", { timeout: 2000 }).click();
    }
  }

  /**
   * Fetches custom rules from a git repository
   * @param customRuleRepository - Repository configuration
   */
  static fetchCustomRules(customRuleRepository: RulesRepositoryFields) {
    cy.contains("button", "Repository", { timeout: 2000 })
      .should("be.enabled")
      .click();
    click(CustomMigrationTargetView.repositoryTypeDropdown);
    clickByText(button, RepositoryType.git);

    inputText(
      CustomMigrationTargetView.repositoryUrl,
      customRuleRepository.repositoryUrl
    );

    if (customRuleRepository.branch) {
      inputText(CustomMigrationTargetView.branch, customRuleRepository.branch);
    }

    if (customRuleRepository.rootPath) {
      inputText(
        CustomMigrationTargetView.rootPath,
        customRuleRepository.rootPath
      );
    }

    if (customRuleRepository.credentials) {
      click(CustomMigrationTargetView.credentialsDropdown);
      clickByText(button, customRuleRepository.credentials.name);
    }
  }

  /**
   * Configures scope settings for analysis
   * @param options - Scope configuration options
   */
  static scopeSelect(options: {
    manuallyAnalyzePackages?: string[];
    excludePackages?: string[];
    openSourceLibraries?: boolean;
  }) {
    const { manuallyAnalyzePackages, excludePackages, openSourceLibraries } =
      options;

    if (manuallyAnalyzePackages) {
      click(analyzeManuallyButton);
      manuallyAnalyzePackages.forEach((pkg) => {
        inputText(enterPackageName, pkg);
        clickByText(addPackageToInclude, "Add");
      });
    }

    if (excludePackages) {
      click(excludePackagesSwitch);
      excludePackages.forEach((pkg) => {
        inputText(enterPackageNameToExclude, pkg);
        clickByText(addPackageToExclude, "Add");
      });
    }

    if (openSourceLibraries) {
      click(ossCheckbox);
    }
  }
}
