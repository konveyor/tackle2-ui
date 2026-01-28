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
  getProfileNameFromApp,
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
const profilesToDelete: AnalysisProfile[] = [];

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

  it("Bug MTA-2887: Tackletestapp binary analysis - manual and profile mode validation", function () {
    // Bug https://github.com/konveyor/tackle2-ui/issues/2887
    const analysisData = getRandomAnalysisData(
      this.analysisData["binary_analysis_on_tackletestapp"]
    );
    analysisData.saveAsProfile = true;

    const applicationData = getRandomApplicationData("tackletestApp_binary", {
      binaryData: this.appData["tackle-testapp-binary"],
    });

    application = new Analysis(applicationData, analysisData);
    application.create();
    cy.wait("@getApplication");
    application.manageCredentials(
      source_credential.name,
      maven_credential.name
    );
    application.analyze();
    application.verifyAnalysisStatus(AnalysisStatuses.completed);

    // Re-run analysis using the saved profile
    const profileName = getProfileNameFromApp(application.name);
    analysisData.profileName = profileName;

    const profileApplication = new Analysis(applicationData, analysisData);
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

    // Store profile for cleanup
    profilesToDelete.push(
      new AnalysisProfile(
        profileName,
        this.analysisData["binary_analysis_on_tackletestapp"]
      )
    );
  });

  afterEach("Persist session", function () {
    Application.open(true);
    application.delete();
  });

  after("Perform test data clean up", function () {
    source_credential.delete();
    maven_credential.delete();
    profilesToDelete.forEach((profile) => profile.delete());
    writeMavenSettingsFile(data.getRandomWord(5), data.getRandomWord(5));
  });
});
