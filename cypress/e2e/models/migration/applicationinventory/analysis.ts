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
  checkSuccessAlert,
  click,
  clickByText,
  clickItemInKebabMenu,
  clickWithin,
  doesExistSelector,
  inputText,
  next,
  selectCheckBox,
  selectFormItems,
  sidedrawerTab,
  uploadApplications,
  verifySelectorText,
} from "../../../../utils/utils";
import {
  AnalysisStatuses,
  Languages,
  MIN,
  ReportTypeSelectors,
  SEC,
  analyzeAppButton,
  analyzeButton,
  appInventoryKebab as kebab,
  button,
  save,
  tdTag,
  trTag,
} from "../../../types/constants";
import {
  RbacValidationRules,
  RulesRepositoryFields,
  analysisData,
  applicationData,
} from "../../../types/types";
import {
  AnalysisLogView,
  analysisColumn,
  analysisDetails,
  closeWizard,
  effortColumn,
  expandAll,
  fileName,
  kebabTopMenuButton,
  logDropDown,
  logFilter,
  manageCredentials,
  mavenCredential,
  numberOfRulesColumn,
  panelBody,
  sourceCredential,
  tabsPanel,
} from "../../../views/analysis.view";
import { bulkApplicationSelectionCheckBox } from "../../../views/applicationinventory.view";
import {
  actionMenuItem,
  successAlertMessage,
} from "../../../views/common.view";
import { AnalysisWizardHelpers } from "../analysis-profiles/analysis-wizard-helpers";

import { Application } from "./application";

export class Analysis extends Application {
  source: string;
  target: string[];
  binary?: string[];
  scope?: string;
  excludePackages?: string[];
  customRule?: string[];
  customRuleRepository?: RulesRepositoryFields;
  sources?: string;
  excludeRuleLabels?: string;
  enableTransaction?: boolean;
  disableTagging?: boolean;
  appName?: string;
  effort?: number;
  manuallyAnalyzePackages?: string[];
  excludedPackagesList?: string[];
  openSourceLibraries?: boolean;
  language: Languages = Languages.Java;
  incidents?: {
    mandatory?: number;
    optional?: number;
    potential?: number;
    information?: number;
    total?: number;
  };
  ruleFileToQuantity?: { [id: string]: number };
  profileName?: string;

  constructor(appData: applicationData, analysisData: analysisData) {
    super(appData);
    this.initAnalysis(appData, analysisData);
  }

  protected initAnalysis(appData: applicationData, analysisData: analysisData) {
    const {
      source,
      target,
      binary,
      scope,
      excludePackages,
      customRule,
      sources,
      excludeRuleLabels,
      enableTransaction,
      disableTagging,
      appName,
      effort,
      manuallyAnalyzePackages,
      excludedPackagesList,
      incidents,
      openSourceLibraries,
      customRuleRepository,
      language,
      ruleFileToQuantity,
      profileName,
    } = analysisData;
    this.name = appData.name;
    this.source = source;
    this.target = target;
    if (binary) this.binary = binary;
    if (scope) this.scope = scope;
    if (customRule) this.customRule = customRule;
    if (customRuleRepository) this.customRuleRepository = customRuleRepository;
    if (sources) this.sources = sources;
    if (excludeRuleLabels) this.excludeRuleLabels = excludeRuleLabels;
    if (enableTransaction) this.enableTransaction = enableTransaction;
    if (disableTagging) this.disableTagging = disableTagging;
    if (appName) this.appName = appName;
    if (effort) this.effort = effort;
    if (excludePackages) this.excludePackages = excludePackages;
    if (manuallyAnalyzePackages)
      this.manuallyAnalyzePackages = manuallyAnalyzePackages;
    if (excludedPackagesList) this.excludedPackagesList = excludedPackagesList;
    if (incidents) this.incidents = incidents;
    if (openSourceLibraries) this.openSourceLibraries = openSourceLibraries;
    if (language) this.language = language;
    if (ruleFileToQuantity) this.ruleFileToQuantity = ruleFileToQuantity;
    if (profileName) this.profileName = profileName;
  }

  /**
   * Selects the analysis mode in the wizard
   * @param mode - "manual" to manually configure analysis, "profile" to use an existing analysis profile
   * @param profileName - Required when mode is "profile". The name of the analysis profile to select
   * @default "manual"
   */
  public selectAnalysisMode(
    mode: "manual" | "profile" = "manual",
    profileName?: string
  ) {
    const modeId =
      mode === "profile" ? "#wizard-mode-profile" : "#wizard-mode-manual";
    cy.get(modeId).check();
    cy.get(modeId).should("be.checked");

    if (mode === "profile") {
      cy.contains(button, "Next").should("have.class", "pf-m-disabled");

      if (profileName) {
        cy.contains("span", "Select an analysis profile").click();
        cy.contains("span.pf-v5-c-menu__item-text", profileName).click();
        cy.contains(button, "Next").should("not.have.class", "pf-m-disabled");
      }
    }
  }

  protected uploadBinary() {
    this.binary.forEach((binaryList) => {
      uploadApplications(binaryList);
      cy.get("span.pf-v5-c-progress__measure", { timeout: 5000 * SEC }).should(
        "contain",
        "100%"
      );
      checkSuccessAlert(successAlertMessage, `Uploaded binary file.`, true);
    });
  }

  protected isNextEnabled() {
    cy.contains(button, "Next", { timeout: 300 * SEC }).should(
      "not.have.class",
      "pf-m-disabled"
    );
  }

  protected tagsToExclude() {
    inputText("#ruleTagToExclude", this.excludeRuleLabels);
    clickByText("#add-package-to-include", "Add");
  }

  analyze(cancel = false): void {
    cy.log("Starting Analysis on application", this.name);
    Application.open();
    this.selectApplication();
    if (cancel) {
      cancelForm();
      return;
    }

    this.startAnalysis();
  }

  private startAnalysis() {
    cy.contains(button, analyzeButton).should("be.enabled").click();

    if (this.profileName) {
      this.selectAnalysisMode("profile", this.profileName);
      next();
      clickByText(button, "Run");
    } else {
      // Manual mode: Configure all analysis settings
      this.selectAnalysisMode("manual");
      next();

      AnalysisWizardHelpers.selectSourceofAnalysis(this.source);
      if (this.binary) this.uploadBinary();
      this.isNextEnabled();
      next();
      AnalysisWizardHelpers.selectLanguage(this.language);
      cy.wait(2 * SEC);
      AnalysisWizardHelpers.selectTarget(this.target);
      next();
      AnalysisWizardHelpers.scopeSelect({
        manuallyAnalyzePackages: this.manuallyAnalyzePackages,
        excludePackages: this.excludePackages,
        openSourceLibraries: this.openSourceLibraries,
      });
      next();
      if (this.customRule) {
        AnalysisWizardHelpers.uploadCustomRule(this.customRule);
      }
      if (this.customRuleRepository) {
        AnalysisWizardHelpers.fetchCustomRules(this.customRuleRepository);
      }
      next();
      if (this.excludeRuleLabels) {
        this.tagsToExclude();
      }
      if (this.enableTransaction) {
        AnalysisWizardHelpers.enableTransactionAnalysis();
      }
      if (this.disableTagging) {
        AnalysisWizardHelpers.disableAutomatedTagging();
      }
      if (!this.sources) {
        next();
      }
      clickByText(button, "Run");
    }
  }

  public static analyzeAll(params: Analysis): void {
    Application.open();
    selectCheckBox(bulkApplicationSelectionCheckBox);
    params.startAnalysis();
  }

  public static analyzeByList(analysisList: Analysis[]): void {
    Application.open();
    analysisList.forEach((currentApp) => {
      currentApp.selectApplication();
    });
    analysisList[0].startAnalysis();
    analysisList.forEach((currentApp) => {
      currentApp.selectApplication();
    });
  }

  static validateAnalyzeButton(rbacRules: RbacValidationRules) {
    Application.open();
    doesExistSelector(analyzeAppButton, rbacRules["Analyze"]);
  }

  verifyAnalysisStatus(status: string, timeout?: number) {
    cy.log(`Verifying analysis status, expecting ${status}`);
    cy.get(tdTag, { log: false })
      .contains(this.name, { log: false })
      .closest(trTag, { log: false })
      .within(() => {
        Analysis.verifyStatus(
          cy.get(analysisColumn, { log: false }),
          status,
          timeout
        );
      });
    this.selectApplication();
  }

  public verifyEffort(effort: number) {
    cy.get(tdTag)
      .contains(this.name)
      .closest(trTag)
      .within(() => {
        cy.get(effortColumn, { timeout: 5 * SEC }).should(
          "contain",
          `${effort}`,
          {
            timeout: 10 * SEC,
          }
        );
      });
  }

  public static verifyAllAnalysisStatuses(status: string, timeout = 10 * MIN) {
    cy.log(`Verifying all analysis statuses, expecting ${status}`);
    cy.get(analysisColumn, { log: false }).each(($el) => {
      Analysis.verifyStatus(cy.wrap($el), status, timeout);
    });
  }

  public static verifyStatus(
    element: Cypress.Chainable,
    status: string,
    timeout = 10 * MIN
  ) {
    element
      .find("div > div:nth-child(2)", { timeout: timeout, log: false })
      .should("not.have.text", AnalysisStatuses.notStarted)
      .and("not.have.text", AnalysisStatuses.scheduled)
      .and("not.have.text", AnalysisStatuses.inProgress)
      .then(($a) => {
        const currentStatus = $a.text().toString() as AnalysisStatuses;
        expect(currentStatus).to.equal(status);
      });
  }

  waitStatusChange(newStatus: string) {
    cy.get(tdTag, { log: false })
      .contains(this.name, { log: false })
      .closest(trTag, { log: false })
      .within(() => {
        cy.get(analysisColumn, { timeout: 60 * SEC }).should(
          "contain",
          newStatus
        );
      });
  }

  openReport() {
    sidedrawerTab(this.name, "Reports");
    clickByText(button, "View analysis details");
    cy.wait(2 * SEC);
  }

  downloadReport(type: ReportTypeSelectors) {
    Application.open();
    sidedrawerTab(this.name, "Reports");
    // The button has an aria-disabled atrr but not the disabled attr itself so verifying if its enabled won't work
    cy.get(type)
      .should("not.have.attr", "aria-disabled", true)
      .and("not.have.class", "pf-m-aria-disabled");
    click(type);
    const extension = type === ReportTypeSelectors.YAML ? "yaml" : "tar";
    cy.verifyDownload(`analysis-report-app-${this.name}.${extension}`, {
      timeout: 30 * SEC,
    });
    this.closeApplicationDetails();
  }

  extractHTMLReport() {
    cy.task("unzip", {
      path: `${Cypress.config("downloadsFolder")}/`,
      file: `analysis-report-app-${this.name}.tar`,
    });
    cy.verifyDownload(`analysis-report-app-${this.name}/index.html`);
  }

  openAnalysisDetails() {
    cy.wait(2000);
    sidedrawerTab(this.name, "Reports");
    clickByText(button, analysisDetails);
    cy.wait(2 * SEC);
  }

  manageCredentials(sourceCred?: string, mavenCred?: string): void {
    cy.wait(2 * SEC);
    clickItemInKebabMenu(this.name, manageCredentials);
    if (sourceCred) {
      selectFormItems(sourceCredential, sourceCred);
    }
    if (mavenCred) {
      selectFormItems(mavenCredential, mavenCred);
    }
    clickByText(button, save);
  }

  static validateTopActionMenu(rbacRules: RbacValidationRules) {
    Application.open();
    if (rbacRules["Top action menu"]["Not available"]) {
      cy.get(".pf-v5-c-page__main-section")
        .eq(1)
        .within(() => {
          doesExistSelector(kebabTopMenuButton, false);
        });
    } else {
      cy.wait(SEC);

      cy.get(".pf-v5-c-page__main-section")
        .eq(1)
        .within(() => {
          clickWithin(kebabTopMenuButton, button);
        });
      verifySelectorText(
        kebab.import,
        actionMenuItem,
        rbacRules["Top action menu"]["Import"]
      );
      verifySelectorText(
        kebab.manageImports,
        actionMenuItem,
        rbacRules["Top action menu"]["Manage application imports"]
      );
      verifySelectorText(
        kebab.manageCredentials,
        actionMenuItem,
        rbacRules["Top action menu"]["Manage credentials"]
      );
      verifySelectorText(
        kebab.delete,
        actionMenuItem,
        rbacRules["Top action menu"]["Delete"]
      );
    }
  }

  validateExcludedTags(): void {
    // Click on App name
    // then Application Details tab
    // Excluded Tags should not be present
    cy.get(fileName + " > a")
      .should("contain", this.appName)
      .click();
    cy.get(tabsPanel).contains("Application Details").click();
    click(expandAll);
    cy.get(panelBody).should("not.contain.text", this.excludeRuleLabels);
  }

  // Method to validate Incidents on report page
  validateIncidents(): void {
    cy.get("div[class='incidentsCount'] > table > tbody").as("incidentTable");
    cy.get("@incidentTable")
      .find("tr")
      .each(($row) => {
        const label = $row.find("td.label_").text();
        const count = $row.find("td.count").text();
        const index = 0;
        if (label.includes("Mandatory")) {
          expect(this.incidents[index].mandatory).equal(Number(count));
        }
        if ($row.children("td.label_").text().includes("Optional")) {
          expect(this.incidents[index].optional).equal(
            Number($row.children("td.count").text())
          );
        }
        if (label.includes("Potential")) {
          expect(this.incidents[index].potential).equal(Number(count));
        }
        if (label.includes("Information")) {
          expect(this.incidents[index].information).equal(Number(count));
        }
      });
  }

  // verifyRulesNumber verifies the number of rules found in an uploaded custom rules file
  public verifyRulesNumber(): void {
    Application.open();
    this.selectApplication();
    cy.contains(button, analyzeButton).should("be.enabled").click();
    this.selectAnalysisMode();
    next();
    AnalysisWizardHelpers.selectSourceofAnalysis(this.source);
    next();
    next();
    next();
    AnalysisWizardHelpers.uploadCustomRule(this.customRule);
    for (const fileName in this.ruleFileToQuantity) {
      const numOfrules = this.ruleFileToQuantity[fileName];
      cy.get(trTag)
        .filter(':contains("' + fileName + '")')
        .within(() => {
          cy.get(numberOfRulesColumn).contains(numOfrules.toString());
        });
    }
    cy.get(closeWizard).click({ force: true });
  }

  cancelAnalysis(): void {
    clickItemInKebabMenu(this.name, "Cancel analysis");
  }

  verifyLogContains(
    analysisLogView: AnalysisLogView,
    searchText: string
  ): void {
    this.openAnalysisDetails();
    cy.get(logFilter).eq(2).click();
    clickByText(logDropDown, analysisLogView);
    cy.wait(3 * SEC);

    cy.get(".pf-v5-c-code-editor__code", { timeout: 10000 })
      .should("be.visible")
      .click()
      .wait(1 * SEC)
      .type("{ctrl}f")
      .wait(1 * SEC);

    cy.get(".find-part textarea.input", { timeout: 5000 })
      .should("be.visible")
      .clear()
      .type(`${searchText}`);

    cy.get(".pf-v5-c-code-editor__code", { timeout: 10000 }).then(($editor) => {
      expect($editor.text()).to.contain(searchText);
    });
  }
}
