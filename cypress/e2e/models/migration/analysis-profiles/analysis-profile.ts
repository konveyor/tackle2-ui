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
  clickWithinByText,
  inputText,
  next,
  performRowActionByIcon,
  selectAnalysisMode,
  selectItemsPerPage,
  selectUserPerspective,
  uploadFile,
} from "../../../../utils/utils";
import {
  Languages,
  RepositoryType,
  SEC,
  analysisProfiles,
  button,
  clearAllFilters,
  migration,
} from "../../../types/constants";
import { RulesRepositoryFields, analysisData } from "../../../types/types";
import {
  addPackageToInclude,
  cancelButton,
  checkboxInput,
  description as profileDescriptionInput,
  languageListbox,
  menuListItem,
  name as profileNameInput,
  ossCheckbox,
  pencilAction,
  progressMeasure,
  ruleTagToExclude,
  submitButton,
  targetCamelSelect,
  targetOpenJDKSelect,
  wizardMainBody,
} from "../../../views/analysis-profile.view";
import {
  addButton,
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
  sourceDropdown,
} from "../../../views/analysis.view";
import * as commonView from "../../../views/common.view";
import { CustomMigrationTargetView } from "../../../views/custom-migration-target.view";
import { navMenu } from "../../../views/menu.view";

export class AnalysisProfile {
  static fullUrl = Cypress.config("baseUrl") + "/analysis-profiles";
  name: string;
  description?: string;
  source: string;
  target: string[];
  binary?: string[];
  excludePackages?: string[];
  customRule?: string[];
  customRuleRepository?: RulesRepositoryFields;
  sources?: string;
  excludeRuleTags?: string;
  enableTransaction?: boolean;
  disableTagging?: boolean;
  effort?: number;
  manuallyAnalyzePackages?: string[];
  excludedPackagesList?: string[];
  openSourceLibraries?: boolean;
  language: Languages = Languages.Java;

  constructor(name: string, analysisData: analysisData, description?: string) {
    this.name = name;
    if (description) this.description = description;
    this.initAnalysisData(analysisData);
  }

  protected initAnalysisData(analysisData: analysisData) {
    const {
      source,
      target,
      binary,
      excludePackages,
      customRule,
      sources,
      excludeRuleTags,
      enableTransaction,
      disableTagging,
      effort,
      manuallyAnalyzePackages,
      excludedPackagesList,
      openSourceLibraries,
      customRuleRepository,
      language,
    } = analysisData;
    this.source = source;
    this.target = target;
    if (binary) this.binary = binary;
    if (customRule) this.customRule = customRule;
    if (customRuleRepository) this.customRuleRepository = customRuleRepository;
    if (sources) this.sources = sources;
    if (excludeRuleTags) this.excludeRuleTags = excludeRuleTags;
    if (enableTransaction) this.enableTransaction = enableTransaction;
    if (disableTagging) this.disableTagging = disableTagging;
    if (effort) this.effort = effort;
    if (excludePackages) this.excludePackages = excludePackages;
    if (manuallyAnalyzePackages)
      this.manuallyAnalyzePackages = manuallyAnalyzePackages;
    if (excludedPackagesList) this.excludedPackagesList = excludedPackagesList;
    if (openSourceLibraries) this.openSourceLibraries = openSourceLibraries;
    if (language) this.language = language;
  }

  public static open(forceReload = false): void {
    const itemsPerPage = 100;
    if (forceReload) {
      cy.visit(AnalysisProfile.fullUrl, { timeout: 35 * SEC }).then((_) => {
        cy.get("h1", { timeout: 10 * SEC }).should("contain", analysisProfiles);
        selectItemsPerPage(itemsPerPage);
      });
      return;
    }

    cy.url().then(($url) => {
      if ($url != AnalysisProfile.fullUrl) {
        selectUserPerspective(migration);
        clickByText(navMenu, analysisProfiles);
        cy.get("h1", { timeout: 60 * SEC }).should("contain", analysisProfiles);
      }
      selectItemsPerPage(itemsPerPage);
    });
  }

  private applyValue<T>(
    isEdit: boolean,
    newValue: T | undefined,
    currentValue: T,
    action: (value: T) => void,
    assign?: (v: T) => void
  ) {
    if (!isEdit && newValue !== undefined) {
      action(newValue);
      assign?.(newValue);
      return;
    }

    if (isEdit && newValue !== undefined) {
      const hasChanged =
        Array.isArray(newValue) && Array.isArray(currentValue)
          ? JSON.stringify(newValue) !== JSON.stringify(currentValue)
          : typeof newValue === "object" && typeof currentValue === "object"
            ? JSON.stringify(newValue) !== JSON.stringify(currentValue)
            : newValue !== currentValue;

      if (hasChanged) {
        action(newValue);
        assign?.(newValue);
      }
    }
  }

  public selectSourceofAnalysis(source: string): void {
    selectAnalysisMode(sourceDropdown, source);
  }

  public static selectLanguage(language: Languages, removePreSelected = false) {
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

  public selectTarget(target: string[]): void {
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

  protected enableTransactionAnalysis() {
    cy.get(enableTransactionAnalysis)
      .invoke("is", ":checked")
      .then((checked) => {
        checked
          ? cy.log("Box is already checked")
          : cy.get(enableTransactionAnalysis).check();
      });
  }

  protected disableAutomatedTagging() {
    cy.get(enableAutomatedTagging)
      .invoke("is", ":checked")
      .then((checked) => {
        checked
          ? cy.get(enableAutomatedTagging).uncheck()
          : cy.log("Box is already unchecked");
      });
  }

  protected uploadCustomRule() {
    for (let i = 0; i < this.customRule.length; i++) {
      cy.contains("button", "Add rules", { timeout: 20000 })
        .should("be.enabled")
        .click();
      const folder = this.customRule[i].split(".").pop();
      uploadFile(`${folder}/${this.customRule[i]}`);
      cy.get(progressMeasure, { timeout: 150000 }).should("contain", "100%");
      cy.contains(addRules, "Add", { timeout: 2000 }).click();
    }
  }

  protected fetchCustomRules() {
    cy.contains("button", "Repository", { timeout: 2000 })
      .should("be.enabled")
      .click();
    click(CustomMigrationTargetView.repositoryTypeDropdown);
    clickByText(button, RepositoryType.git);

    inputText(
      CustomMigrationTargetView.repositoryUrl,
      this.customRuleRepository.repositoryUrl
    );

    if (this.customRuleRepository.branch) {
      inputText(
        CustomMigrationTargetView.branch,
        this.customRuleRepository.branch
      );
    }

    if (this.customRuleRepository.rootPath) {
      inputText(
        CustomMigrationTargetView.rootPath,
        this.customRuleRepository.rootPath
      );
    }

    if (this.customRuleRepository.credentials) {
      click(CustomMigrationTargetView.credentialsDropdown);
      clickByText(button, this.customRuleRepository.credentials.name);
    }
  }

  protected scopeSelect() {
    if (this.manuallyAnalyzePackages) {
      // for Scope's "Select the list of packages to be analyzed manually" option
      click(analyzeManuallyButton);
      inputText(enterPackageName, this.manuallyAnalyzePackages);
      clickByText(addButton, "Add");
    }

    if (this.excludePackages) {
      click(excludePackagesSwitch);
      inputText(enterPackageNameToExclude, this.excludePackages);
      clickByText(addButton, "Add");
    }

    if (this.openSourceLibraries) {
      click(ossCheckbox);
    }
  }

  protected tagsToExclude() {
    inputText(ruleTagToExclude, this.excludeRuleTags);
    clickByText(addPackageToInclude, "Add");
  }

  private fillWizard(data: Partial<AnalysisProfile>, isEdit = false) {
    this.applyValue(
      isEdit,
      data.name,
      this.name,
      (v) => inputText(profileNameInput, v),
      (v) => (this.name = v)
    );

    this.applyValue(
      isEdit,
      data.description,
      this.description,
      (v) => inputText(profileDescriptionInput, v),
      (v) => (this.description = v)
    );
    next();

    this.applyValue(
      isEdit,
      data.source,
      this.source,
      (v) => this.selectSourceofAnalysis(v),
      (v) => (this.source = v)
    );
    next();

    this.applyValue(
      isEdit,
      data.language,
      this.language,
      (v) => AnalysisProfile.selectLanguage(v),
      (v) => (this.language = v)
    );

    this.applyValue(
      isEdit,
      data.target,
      this.target,
      (v) => this.selectTarget(v),
      (v) => (this.target = v)
    );
    next();

    if (
      !isEdit ||
      data.manuallyAnalyzePackages ||
      data.excludePackages ||
      data.openSourceLibraries !== undefined
    ) {
      Object.assign(this, data);
      this.scopeSelect();
    }
    next();

    this.applyValue(isEdit, data.customRule, this.customRule, (v) => {
      this.customRule = v;
      this.uploadCustomRule();
    });

    this.applyValue(
      isEdit,
      data.customRuleRepository,
      this.customRuleRepository,
      (v) => {
        this.customRuleRepository = v;
        this.fetchCustomRules();
      }
    );
    next();

    this.applyValue(
      isEdit,
      data.excludeRuleTags,
      this.excludeRuleTags,
      () => this.tagsToExclude(),
      (v) => (this.excludeRuleTags = v)
    );

    this.applyValue(
      isEdit,
      data.enableTransaction,
      this.enableTransaction,
      () => this.enableTransactionAnalysis(),
      (v) => (this.enableTransaction = v)
    );

    this.applyValue(
      isEdit,
      data.disableTagging,
      this.disableTagging,
      () => this.disableAutomatedTagging(),
      (v) => (this.disableTagging = v)
    );
    next();
    cy.get(submitButton, { timeout: 10 * SEC }).click();
  }

  create(cancel = false) {
    AnalysisProfile.open();
    clickByText(button, "Create new");

    if (cancel) {
      click(cancelButton);
      return;
    }

    this.fillWizard(this, false);
  }

  edit(updatedData: Partial<AnalysisProfile>, cancel = false) {
    AnalysisProfile.open();
    performRowActionByIcon(this.name, pencilAction);

    if (cancel) {
      click(cancelButton);
      return;
    }

    this.fillWizard(updatedData, true);
  }

  delete(cancel = false) {
    AnalysisProfile.open();
    clickItemInKebabMenu(this.name, "Delete");

    cancel ? click(commonView.cancelButton) : click(commonView.confirmButton);
  }
}
