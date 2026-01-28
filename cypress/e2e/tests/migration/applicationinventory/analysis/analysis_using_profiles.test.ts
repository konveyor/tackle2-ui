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
  deleteAllProfiles,
  deleteBulkApplicationsByApi,
  exists,
  getRandomAnalysisData,
  getRandomApplicationData,
  login,
} from "../../../../../utils/utils";
import { AnalysisProfile } from "../../../../models/migration/analysis-profiles/analysis-profile";
import { Analysis } from "../../../../models/migration/applicationinventory/analysis";
import { Issues } from "../../../../models/migration/dynamic-report/issues/issues";
import { AnalysisStatuses, MIN } from "../../../../types/constants";

const applicationIds: number[] = [];

describe(["@tier1"], "Analysis using profiles", () => {
  before("Login", function () {
    login();
    cy.visit("/");
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
    cy.intercept("DELETE", "/hub/application*").as("deleteApplication");
  });

  it("Analysis using profile", function () {
    const profileName = `profile-${data.getRandomNumber()}`;
    const profileDescription = data.getDescription();
    const profileData = getRandomAnalysisData(
      this.analysisData["bookServerApp_analysis_profile"]
    );

    const analysisProfile = new AnalysisProfile(
      profileName,
      profileData,
      profileDescription
    );

    analysisProfile.create();
    profileData.profileName = profileName;
    const application = new Analysis(
      getRandomApplicationData("bookServer_Profile_Analysis", {
        sourceData: this.appData["bookserver-app"],
      }),
      profileData
    );

    application.create();
    cy.wait("@getApplication");
    application.extractIDfromName().then((id) => {
      applicationIds.push(id);
    });
    application.analyze();
    application.waitStatusChange(AnalysisStatuses.scheduled);

    application.verifyAnalysisStatus(AnalysisStatuses.completed, 30 * MIN);
    Issues.openSingleApplication(application.name);
    exists("CUSTOM RULE FOR DEPENDENCIES");
    analysisProfile.delete();
  });

  after("Perform test data clean up", function () {
    deleteBulkApplicationsByApi(applicationIds);
  });
});
