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
/// <reference types="cypress" />

import { getRandomCredentialsData } from "../../../../../utils/data_utils";
import {
  checkSuccessAlert,
  cleanupDownloads,
  deleteAllAnalysisProfiles,
  deleteApplicationTableRows,
  deleteBulkApplicationsByApi,
  exists,
  getProfileNameFromApp,
  getRandomAnalysisData,
  getRandomApplicationData,
  validateTextPresence,
} from "../../../../../utils/utils";
import { CredentialsSourceControlUsername } from "../../../../models/administration/credentials/credentialsSourceControlUsername";
import { GeneralConfig } from "../../../../models/administration/general/generalConfig";
import { AnalysisProfile } from "../../../../models/migration/analysis-profiles/analysis-profile";
import { Analysis } from "../../../../models/migration/applicationinventory/analysis";
import { TaskManager } from "../../../../models/migration/task-manager/task-manager";
import {
  AnalysisStatuses,
  CredentialType,
  ReportTypeSelectors,
  TaskKind,
  TaskStatus,
  UserCredentials,
  tdTag,
} from "../../../../types/constants";
import {
  dependencies,
  infoAlertMessage,
  issues,
  technologies,
} from "../../../../views/common.view";
const applicationIds: number[] = [];
let staticReportApp: Analysis;
const credentialsList: Array<CredentialsSourceControlUsername> = [];
const profilesToDelete: AnalysisProfile[] = [];
const staticReportAppName = "bookserver-static-report-test";

// Helper function for static report pagination
const selectItemsPerPageInReport = (items: number) => {
  cy.get("#pagination-options-menu-bottom-toggle", { log: false }).then(
    ($toggleBtn) => {
      if ($toggleBtn.eq(0).is(":disabled")) {
        return;
      }
      $toggleBtn.eq(0).trigger("click");
      cy.get(`li > button`, { log: false }).contains(`${items}`).click({
        force: true,
        log: false,
      });
    }
  );
};

describe(["@tier0"], "Tier 0 Analysis and Static Report validation ", () => {
  before("Clean up pre-existing test data", function () {
    deleteApplicationTableRows();
    deleteAllAnalysisProfiles();
  });

  beforeEach("Load data", function () {
    cy.fixture("application").then(function (appData) {
      this.appData = appData;
    });
    cy.fixture("analysis").then(function (analysisData) {
      this.analysisData = analysisData;
    });

    // Interceptors
    cy.intercept("POST", "/hub/application*").as("postApplication");
    cy.intercept("GET", "/hub/application*").as("getApplication");
    cy.visit("/");
  });

  it("Creating source control credentials with username/password", function () {
    const scCredsUsername = new CredentialsSourceControlUsername(
      getRandomCredentialsData(
        CredentialType.sourceControl,
        UserCredentials.usernamePassword
      )
    );
    scCredsUsername.create();
    credentialsList.push(scCredsUsername);
  });

  it("Bookserver source analysis - manual and profile mode validation", function () {
    const analysisData = getRandomAnalysisData(
      this.analysisData["source_analysis_on_bookserverapp"]
    );
    analysisData.saveAsProfile = true;

    const applicationData = getRandomApplicationData("bookserverApp", {
      sourceData: this.appData["bookserver-app"],
    });
    applicationData.name = staticReportAppName;

    staticReportApp = new Analysis(applicationData, analysisData);
    staticReportApp.create();
    cy.wait("@getApplication");
    staticReportApp.extractIDfromName().then((id) => {
      applicationIds.push(id);
    });
    staticReportApp.analyze();
    checkSuccessAlert(infoAlertMessage, `Submitted for analysis`);
    staticReportApp.verifyAnalysisStatus(AnalysisStatuses.completed);

    // Re-run analysis using the saved profile
    const profileName = getProfileNameFromApp(staticReportApp.name);
    analysisData.profileName = profileName;
    applicationData.name = staticReportAppName;

    const profileApplication = new Analysis(applicationData, analysisData);
    profileApplication.analyze();
    checkSuccessAlert(infoAlertMessage, `Submitted for analysis`);
    profileApplication.waitStatusChange(AnalysisStatuses.scheduled);
    profileApplication.verifyAnalysisStatus(AnalysisStatuses.completed);

    // Store profile for cleanup
    profilesToDelete.push(
      new AnalysisProfile(
        profileName,
        this.analysisData["source_analysis_on_bookserverapp"]
      )
    );
  });

  it("Validate saved analysis profile details", function () {
    const profileName = getProfileNameFromApp(staticReportApp.name);
    AnalysisProfile.open(true);
    exists(profileName);

    // Validate profile information in details page
    const savedProfile = new AnalysisProfile(
      profileName,
      getRandomAnalysisData(
        this.analysisData["source_analysis_on_bookserverapp"]
      )
    );
    savedProfile.validateAnalysisProfileInformation();
  });

  it("Check the bookserver task status on task manager page", function () {
    TaskManager.verifyTaskStatus(
      staticReportApp.name,
      TaskKind.analyzer,
      TaskStatus.succeeded
    );
    TaskManager.verifyTaskStatus(
      staticReportApp.name,
      TaskKind.techDiscovery,
      TaskStatus.succeeded
    );
    TaskManager.verifyTaskStatus(
      staticReportApp.name,
      TaskKind.languageDiscovery,
      TaskStatus.succeeded
    );
  });

  it("Download static HTML report", function () {
    cy.visit("/");
    cleanupDownloads();
    GeneralConfig.enableDownloadReport();
    staticReportApp.downloadReport(ReportTypeSelectors.HTML);
    staticReportApp.extractHTMLReport();
  });

  after("Perform test data clean up", function () {
    deleteBulkApplicationsByApi(applicationIds);
    credentialsList.forEach((credential) => credential.delete());
    profilesToDelete.forEach((profile) => profile.delete());
  });
});

describe(
  ["@tier0"],
  "Validate Static Report UI",
  { baseUrl: null },
  function () {
    const reportData = {
      name: "Adopt Maven Surefire plugin",
      category: "mandatory",
      target: "quarkus",
      dependency: "com.fasterxml.jackson.core.jackson-databind",
      technology: "Spring DI",
    };

    beforeEach("Open static report", function () {
      // Visit file by using the relative path from rootDir
      cy.visit(
        `./run/downloads/analysis-report-app-${staticReportAppName}/index.html`
      );
    });

    it("Validate Application Menu", function () {
      cy.get(tdTag).eq(0).should("have.text", staticReportAppName);
      cy.get(tdTag).eq(1).click(); // tags
      validateTextPresence(tdTag, reportData.technology);
      cy.get(tdTag).eq(2).invoke("text").then(parseInt).should("be.gte", 0);
    });

    it("Validate Issues Tab", function () {
      cy.contains("a", staticReportAppName).click();
      cy.contains("button > span", issues).click();
      selectItemsPerPageInReport(100);
      validateTextPresence(tdTag, reportData.name);
      validateTextPresence(tdTag, reportData.category);
      validateTextPresence(tdTag, reportData.target);
    });

    it("Validate Dependencies Tab", function () {
      cy.contains("a", staticReportAppName).click();
      cy.contains("button > span", dependencies).click();
      selectItemsPerPageInReport(100);
      validateTextPresence(tdTag, reportData.dependency);
    });

    it("Validate Technologies Tab", function () {
      cy.contains("a", staticReportAppName).click();
      cy.contains("button > span", technologies).click();
      validateTextPresence("div.pf-v6-c-label-group", reportData.technology);
    });

    it("Validate Issues Menu", function () {
      cy.contains("nav > ul > a", issues).click();
      selectItemsPerPageInReport(100);
      validateTextPresence(tdTag, reportData.name);
      validateTextPresence(tdTag, reportData.category);
      validateTextPresence(tdTag, reportData.target);
    });

    it("Validate Dependencies Menu", function () {
      cy.contains("nav > ul > a", dependencies).click();
      selectItemsPerPageInReport(100);
      validateTextPresence(tdTag, reportData.dependency);
    });

    after("Cleanup downloads", function () {
      cleanupDownloads();
    });
  }
);
