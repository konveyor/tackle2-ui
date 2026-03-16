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

import { getRandomWord } from "../../../../utils/data_utils";
import {
  checkSuccessAlert,
  createMultipleTags,
  deleteByList,
  getRandomAnalysisData,
  login,
} from "../../../../utils/utils";
import { AnalysisProfile } from "../../../models/migration/analysis-profiles/analysis-profile";
import { Archetype } from "../../../models/migration/archetypes/archetype";
import { TargetProfile } from "../../../models/migration/archetypes/target-profile";
import { Tag } from "../../../models/migration/controls/tags";
import { defaultGenerator } from "../../../types/constants";
import { successAlertMessage } from "../../../views/common.view";

let tags: Tag[];
let archetype: Archetype;
let analysisProfile: AnalysisProfile;

describe(["@tier3"], "CRUD operations on Archetype target profile", () => {
  before("Login", function () {
    login();
    cy.visit("/");

    tags = createMultipleTags(2);

    archetype = new Archetype(
      `test-arch-${getRandomWord(8)}`,
      [tags[0].name],
      [tags[1].name]
    );
    archetype.create();

    cy.fixture("analysis").then(function (analysisData) {
      this.analysisData = analysisData;
      analysisProfile = new AnalysisProfile(
        `test-profile-${getRandomWord(8)}`,
        getRandomAnalysisData(this.analysisData["eap8_bookserverApp"]),
        "Analysis profile for target profile testing"
      );
      analysisProfile.create();
    });
  });

  it("Scenario 1: Create target profile with only generator", function () {
    // Automates Polarion MTA-786
    const targetProfile = new TargetProfile(
      `test-profile-generator-${getRandomWord(8)}`,
      [defaultGenerator]
    );
    targetProfile.create(archetype.name);
    checkSuccessAlert(
      successAlertMessage,
      `Success alert:Target profile was successfully created.`,
      true
    );

    targetProfile.delete();
    checkSuccessAlert(
      successAlertMessage,
      `Success alert:Target profile was successfully deleted.`,
      true
    );
  });

  it("Scenario 2: While creating target profile with only analysis profile, \
    verify create button is enabled", function () {
    const targetProfile = new TargetProfile(
      `test-profile-analysis-${getRandomWord(8)}`,
      undefined,
      analysisProfile.name
    );
    targetProfile.create(archetype.name);
    targetProfile.delete();
  });

  it("Scenario 3: While creating target profile with both generator and analysis profile, \
    verify create button is enabled", function () {
    const targetProfile = new TargetProfile(
      `test-profile-both-${getRandomWord(8)}`,
      [defaultGenerator],
      analysisProfile.name
    );
    targetProfile.create(archetype.name);
    targetProfile.delete();
  });

  after("Clear test data", function () {
    analysisProfile.delete();
    archetype.delete();
    deleteByList(tags);
  });
});
