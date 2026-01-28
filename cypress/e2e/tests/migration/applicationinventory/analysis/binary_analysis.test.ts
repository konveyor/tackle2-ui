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

import * as data from "../../../../../utils/data_utils";
import {
  getRandomAnalysisData,
  getRandomApplicationData,
  login,
  writeMavenSettingsFile,
} from "../../../../../utils/utils";
import { CredentialsMaven } from "../../../../models/administration/credentials/credentialsMaven";
import { CredentialsSourceControlUsername } from "../../../../models/administration/credentials/credentialsSourceControlUsername";
import { MavenConfiguration } from "../../../../models/administration/repositories/maven";
import { AnalysisProfile } from "../../../../models/migration/analysis-profiles/analysis-profile";
import { Analysis } from "../../../../models/migration/applicationinventory/analysis";
import { Application } from "../../../../models/migration/applicationinventory/application";
import {
  AnalysisStatuses,
  CredentialType,
  UserCredentials,
} from "../../../../types/constants";
import { AppIssue } from "../../../../types/types";
let source_credential: CredentialsSourceControlUsername;
let maven_credential: CredentialsMaven;
const mavenConfiguration = new MavenConfiguration();
let application: Analysis;

describe(["@tier1"], "Binary Analysis", () => {
  before("Login", function () {
    login();
    cy.visit("/");

    // Clears artifact repository
    mavenConfiguration.clearRepository();

    //Create source and maven credentials required for analysis
    source_credential = new CredentialsSourceControlUsername(
      data.getRandomCredentialsData(
        CredentialType.sourceControl,
        UserCredentials.usernamePassword,
        true
      )
    );
    source_credential.create();

    maven_credential = new CredentialsMaven(
      data.getRandomCredentialsData(CredentialType.maven, "None", true)
    );
    maven_credential.create();
  });

  beforeEach("Load data", function () {
    cy.fixture("application").then(function (appData) {
      this.appData = appData;
    });
    cy.fixture("analysis").then(function (analysisData) {
      this.analysisData = analysisData;
    });

    cy.intercept("GET", "/hub/application*").as("getApplication");
  });

  it("Tackletestapp binary analysis - manual and profile mode validation", function () {
    const analysisData = getRandomAnalysisData(
      this.analysisData["binary_analysis_on_tackletestapp"]
    );
    analysisData.saveAsProfile = true;

    application = new Analysis(
      getRandomApplicationData("tackletestApp_binary", {
        binaryData: this.appData["tackle-testapp-binary"],
      }),
      analysisData
    );
    application.create();
    cy.wait("@getApplication");
    application.manageCredentials(
      source_credential.name,
      maven_credential.name
    );
    application.analyze();
    application.verifyAnalysisStatus(AnalysisStatuses.completed);
    Application.open(true);
    application.verifyEffort(
      this.analysisData["binary_analysis_on_tackletestapp"]["effort"]
    );
    application.validateIssues(
      this.analysisData["binary_analysis_on_tackletestapp"]["issues"]
    );
    this.analysisData["binary_analysis_on_tackletestapp"]["issues"].forEach(
      (currentIssue: AppIssue) => {
        application.validateAffected(currentIssue);
      }
    );

    // Re-run analysis using the saved profile
    const profileName = `profile_${application.name}`;
    analysisData.profileName = profileName;

    const profileApplication = new Analysis(application, analysisData);
    profileApplication.analyze();
    profileApplication.verifyAnalysisStatus(AnalysisStatuses.completed);

    // Verify results match
    Application.open(true);
    profileApplication.verifyEffort(
      this.analysisData["binary_analysis_on_tackletestapp"]["effort"]
    );
    profileApplication.validateIssues(
      this.analysisData["binary_analysis_on_tackletestapp"]["issues"]
    );
    this.analysisData["binary_analysis_on_tackletestapp"]["issues"].forEach(
      (currentIssue: AppIssue) => {
        profileApplication.validateAffected(currentIssue);
      }
    );

    // Delete the saved profile
    const savedProfile = new AnalysisProfile(profileName, {} as any);
    savedProfile.delete();
  });

  afterEach("Persist session", function () {
    Application.open(true);
    application.delete();
  });

  after("Perform test data clean up", function () {
    source_credential.delete();
    maven_credential.delete();
    writeMavenSettingsFile(data.getRandomWord(5), data.getRandomWord(5));
  });
});
