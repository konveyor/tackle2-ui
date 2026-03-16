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

import { getDescription, getRandomNumber } from "../../../../utils/data_utils";
import {
  checkSuccessAlert,
  exists,
  getRandomAnalysisData,
  notExists,
} from "../../../../utils/utils";
import { AnalysisProfile } from "../../../models/migration/analysis-profiles/analysis-profile";
import * as commonView from "../../../views/common.view";

describe(["@tier2"], "Analysis Profile CRUD operations", () => {
  beforeEach("Login", function () {
    cy.fixture("analysis").then(function (analysisData) {
      this.analysisData = analysisData;
    });
  });

  it("Analysis Profile CRUD", function () {
    const profileName = `profile-${getRandomNumber()}`;
    const profileDescription = getDescription();

    const analysisProfile = new AnalysisProfile(
      profileName,
      getRandomAnalysisData(
        this.analysisData["bookServerApp_analysis_profile"]
      ),
      profileDescription
    );

    analysisProfile.create();

    checkSuccessAlert(
      commonView.successAlertMessage,
      `Analysis profile ${profileName} was successfully created.`,
      true
    );
    exists(profileName);

    // Update name and description
    const updatedProfileName = `updated-profile-${getRandomNumber()}`;
    const updatedProfileDescription = getDescription();
    analysisProfile.edit(
      {
        name: updatedProfileName,
        description: updatedProfileDescription,
      },
      false
    );

    checkSuccessAlert(
      commonView.successAlertMessage,
      `Analysis profile ${updatedProfileName} was successfully updated.`,
      true
    );
    exists(updatedProfileName);

    // Validate the updated profile information
    analysisProfile.validateAnalysisProfileInformation();

    analysisProfile.delete();
    checkSuccessAlert(
      commonView.successAlertMessage,
      `Analysis profile ${updatedProfileName} was successfully deleted.`,
      true
    );
    notExists(analysisProfile.name);
  });
});
