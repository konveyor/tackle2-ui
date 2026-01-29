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

import * as data from "../../../utils/data_utils";
import { getRandomUserData } from "../../../utils/data_utils";
import {
  createMultipleTags,
  deleteAllMigrationWaves,
  deleteApplicationTableRows,
  deleteByList,
  exists,
  getRandomAnalysisData,
  getRandomApplicationData,
  login,
} from "../../../utils/utils";
import { AssessmentQuestionnaire } from "../../models/administration/assessment_questionnaire/assessment_questionnaire";
import { User } from "../../models/keycloak/users/user";
import { UserMigrator } from "../../models/keycloak/users/userMigrator";
import { AnalysisProfile } from "../../models/migration/analysis-profiles/analysis-profile";
import { Analysis } from "../../models/migration/applicationinventory/analysis";
import { Application } from "../../models/migration/applicationinventory/application";
import { Archetype } from "../../models/migration/archetypes/archetype";
import { TargetProfile } from "../../models/migration/archetypes/target-profile";
import { Stakeholders } from "../../models/migration/controls/stakeholders";
import { Tag } from "../../models/migration/controls/tags";
import { Issues } from "../../models/migration/dynamic-report/issues/issues";
import {
  AnalysisStatuses,
  MIN,
  button,
  legacyPathfinder,
  tdTag,
  trTag,
} from "../../types/constants";
import {
  analysisProfileMode,
  analysisProfileSelect,
} from "../../views/analysis.view";
import { actionMenuItem } from "../../views/common.view";

const stakeholdersList: Stakeholders[] = [];
const stakeholdersNameList: string[] = [];

let tags: Tag[] = [];
let analysisProfile1: AnalysisProfile;
let analysisProfile2: AnalysisProfile;
let archetype: Archetype;
let targetProfile: TargetProfile;

describe(["@tier3", "@rhsso", "@rhbk"], "Migrator RBAC operations", () => {
  const userMigrator = new UserMigrator(getRandomUserData());
  const application = new Application(getRandomApplicationData());
  let profileData: any;

  before("Creating RBAC users, adding roles for them", () => {
    cy.clearLocalStorage();
    login();
    cy.visit("/");
    AssessmentQuestionnaire.enable(legacyPathfinder);
    const stakeholder = new Stakeholders(data.getEmail(), data.getFullName());
    stakeholder.create();

    stakeholdersList.push(stakeholder);
    stakeholdersNameList.push(stakeholder.name);

    tags = createMultipleTags(2);
    archetype = new Archetype(
      `test-archetype-${Date.now()}`,
      [tags[0].name], // Criteria tags
      [tags[1].name] // Archetype tags
    );
    archetype.create();

    // Create first analysis profile (not linked to archetype)
    cy.fixture("analysis").then(function (analysisData) {
      profileData = getRandomAnalysisData(
        analysisData["bookServerApp_analysis_profile"]
      );

      analysisProfile1 = new AnalysisProfile(
        `profile-unlinked-${Date.now()}`,
        profileData,
        "Analysis profile not linked to archetype"
      );
      analysisProfile1.create();

      // Create second analysis profile (will be linked to archetype)

      analysisProfile2 = new AnalysisProfile(
        `profile-linked-${Date.now()}`,
        profileData,
        "Analysis profile linked to archetype"
      );
      analysisProfile2.create();
      profileData.profileName = analysisProfile2.name;

      // Link second analysis profile to archetype via target profile
      targetProfile = new TargetProfile(
        `target-profile-${Date.now()}`,
        undefined,
        analysisProfile2.name
      );
      targetProfile.create(archetype.name);
    });

    application.create();
    application.perform_review("low");
    User.loginKeycloakAdmin();
    userMigrator.create();
  });

  beforeEach("Persist session", function () {
    cy.fixture("rbac").then(function (rbacRules) {
      this.rbacRules = rbacRules["migrator"];
    });
    userMigrator.login();
  });

  it("Migrator, validate create application button", function () {
    Application.validateCreateAppButton(this.rbacRules);
  });

  it("Bug MTA-6273: Migrator, validate top action menu", function () {
    Analysis.validateTopActionMenu(this.rbacRules);
  });

  it("Migrator, validate analyze button", function () {
    Analysis.validateAnalyzeButton(this.rbacRules);
  });

  it("Migrator, validate application context menu", function () {
    application.validateAppContextMenu(this.rbacRules);
  });

  it("Migrator, validate ability to upload binary", function () {
    application.validateUploadBinary(this.rbacRules);
  });

  it("Migrator, validate Analysis Profiles create button", function () {
    AnalysisProfile.validateCreateButton(this.rbacRules);
  });

  it("Migrator, 1) verify only archetype-linked analysis profiles are visible in dropdown \
    2) Perform analysis using analysis profile", function () {
    login();
    cy.visit("/");

    const appWithArchetype = new Analysis(
      getRandomApplicationData("bookServer_Profile_Analysis", {
        sourceData: this.appData["bookserver-app"],
      }),
      profileData
    );
    appWithArchetype.create();

    // Verify only analysis profiles linked to app's archetype target profile are available
    // and that system analysis profiles are not available for migrator.
    userMigrator.login();
    Application.open();

    cy.get(tdTag)
      .contains(appWithArchetype.name)
      .closest(trTag)
      .within(() => {
        cy.get("input[type='checkbox']").check();
      });
    cy.contains(button, "Analyze").should("be.enabled").click();

    // Select analysis profile mode
    cy.get(analysisProfileMode).check();
    cy.get(analysisProfileMode).should("be.checked");
    cy.get(analysisProfileSelect).click();

    // Verify only the second analysis profile (linked to archetype) is visible
    cy.get(actionMenuItem).contains(analysisProfile2.name).should("be.visible");

    // Verify the first analysis profile (not linked to archetype) is NOT visible
    cy.get(actionMenuItem).contains(analysisProfile1.name).should("not.exist");
    cy.contains(button, "Cancel").click();

    // As migrator, perform application analysis using analysis profile
    appWithArchetype.analyze();
    appWithArchetype.waitStatusChange(AnalysisStatuses.scheduled);

    appWithArchetype.verifyAnalysisStatus(AnalysisStatuses.completed, 30 * MIN);
    Issues.openSingleApplication(application.name);
    exists("CUSTOM RULE FOR DEPENDENCIES");
  });

  after("", () => {
    login();
    cy.visit("/");
    deleteAllMigrationWaves();
    deleteApplicationTableRows();
    targetProfile.open(archetype.name);
    targetProfile.delete();
    archetype.delete();
    analysisProfile2.delete();
    analysisProfile1.delete();
    deleteByList(stakeholdersList);
    deleteByList(tags);
    User.loginKeycloakAdmin();
    userMigrator.delete();
  });
});
