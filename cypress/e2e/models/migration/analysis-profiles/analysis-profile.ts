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
  doesExistSelector,
  inputText,
  next,
  performRowActionByIcon,
  selectItemsPerPage,
  selectRow,
  selectUserPerspective,
} from "../../../../utils/utils";
import {
  Languages,
  SEC,
  analysisProfiles,
  button,
  migration,
} from "../../../types/constants";
import { RulesRepositoryFields, analysisData } from "../../../types/types";
import {
  cancelButton,
  createProfileButton,
  description as profileDescriptionInput,
  includeLabelsInput,
  includeLabelsMenuItem,
  name as profileNameInput,
  pencilAction,
  ruleLabelToExclude,
  submitButton,
} from "../../../views/analysis-profile.view";
import { rightSideMenu } from "../../../views/analysis.view";
import * as commonView from "../../../views/common.view";
import { navMenu } from "../../../views/menu.view";

import { AnalysisWizardHelpers } from "./analysis-wizard-helpers";

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
  excludeRuleLabels?: string;
  includeRuleLabels?: string;
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
      excludeRuleLabels,
      includeRuleLabels,
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
    if (excludeRuleLabels) this.excludeRuleLabels = excludeRuleLabels;
    if (includeRuleLabels) this.includeRuleLabels = includeRuleLabels;
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

  public static validateCreateButton(rbacRules: any): void {
    AnalysisProfile.open();
    doesExistSelector(createProfileButton, rbacRules["Create new"]);
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

  protected labelsToExclude(label: string) {
    inputText(ruleLabelToExclude, label);
    clickByText(button, "Add");
  }

  protected labelsToInclude(label: string) {
    click(includeLabelsInput);
    cy.get(includeLabelsMenuItem).contains(label).click();
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
      (v) => AnalysisWizardHelpers.selectSourceofAnalysis(v),
      (v) => (this.source = v)
    );
    next();

    this.applyValue(
      isEdit,
      data.language,
      this.language,
      (v) => AnalysisWizardHelpers.selectLanguage(v),
      (v) => (this.language = v)
    );

    this.applyValue(
      isEdit,
      data.target,
      this.target,
      (v) => AnalysisWizardHelpers.selectTarget(v),
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
      AnalysisWizardHelpers.scopeSelect({
        manuallyAnalyzePackages: this.manuallyAnalyzePackages,
        excludePackages: this.excludePackages,
        openSourceLibraries: this.openSourceLibraries,
      });
    }
    next();

    this.applyValue(isEdit, data.customRule, this.customRule, (v) => {
      this.customRule = v;
      AnalysisWizardHelpers.uploadCustomRule(this.customRule);
    });

    this.applyValue(
      isEdit,
      data.customRuleRepository,
      this.customRuleRepository,
      (v) => {
        this.customRuleRepository = v;
        AnalysisWizardHelpers.fetchCustomRules(this.customRuleRepository);
      }
    );
    next();

    this.applyValue(
      isEdit,
      data.includeRuleLabels,
      this.includeRuleLabels,
      (v) => this.labelsToInclude(v),
      (v) => (this.includeRuleLabels = v)
    );

    this.applyValue(
      isEdit,
      data.excludeRuleLabels,
      this.excludeRuleLabels,
      (v) => this.labelsToExclude(v),
      (v) => (this.excludeRuleLabels = v)
    );

    this.applyValue(
      isEdit,
      data.enableTransaction,
      this.enableTransaction,
      () => AnalysisWizardHelpers.enableTransactionAnalysis(),
      (v) => (this.enableTransaction = v)
    );

    this.applyValue(
      isEdit,
      data.disableTagging,
      this.disableTagging,
      () => AnalysisWizardHelpers.disableAutomatedTagging(),
      (v) => (this.disableTagging = v)
    );
    next();
    cy.get(submitButton, { timeout: 10 * SEC }).click();
  }

  create(cancel = false) {
    AnalysisProfile.open();
    cy.get(createProfileButton).click();

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

  validateAnalysisProfileInformation(): void {
    AnalysisProfile.open();
    selectRow(this.name);
    cy.get(rightSideMenu).within(() => {
      // Validate description
      if (this.description) {
        cy.contains(this.description, { timeout: 5 * SEC });
      }

      // Validate scope - open source libraries
      if (this.openSourceLibraries !== undefined) {
        const expectedValue = this.openSourceLibraries ? "Yes" : "No";
        cy.contains(expectedValue, { timeout: 5 * SEC });
      }

      // Validate scope - manually analyzed packages
      if (this.manuallyAnalyzePackages) {
        this.manuallyAnalyzePackages.forEach((pkg) => {
          cy.contains(pkg, { timeout: 5 * SEC });
        });
      }

      // Validate scope - excluded packages
      if (this.excludePackages) {
        this.excludePackages.forEach((pkg) => {
          cy.contains(pkg, { timeout: 5 * SEC });
        });
      }

      // Validate target
      if (this.target) {
        this.target.forEach((targetItem) => {
          cy.contains(targetItem, { timeout: 5 * SEC });
        });
      }

      // Validate custom rule repository
      if (this.customRuleRepository) {
        cy.contains(this.customRuleRepository.repositoryUrl, {
          timeout: 5 * SEC,
        });
      }

      // Validate custom rules
      if (this.customRule) {
        this.customRule.forEach((rule) => {
          cy.contains(rule, { timeout: 5 * SEC });
        });
      }

      // Validate included rule tags
      if (this.includeRuleLabels) {
        cy.contains(this.includeRuleLabels, { timeout: 5 * SEC });
      }

      // Validate excluded rule tags
      if (this.excludeRuleLabels) {
        cy.contains(this.excludeRuleLabels, { timeout: 5 * SEC });
      }
    });
  }
}
