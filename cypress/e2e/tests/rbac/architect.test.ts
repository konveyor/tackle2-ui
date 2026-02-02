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

import { getRandomUserData } from "../../../utils/data_utils";
import {
  createMultipleStakeholders,
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
import { UserArchitect } from "../../models/keycloak/users/userArchitect";
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
} from "../../types/constants";
import {
  analysisProfileMode,
  analysisProfileSelect,
} from "../../views/analysis.view";
import { actionMenuItem } from "../../views/common.view";

let tags: Tag[] = [];
let stakeholders: Array<Stakeholders> = [];
let analysisProfile1: AnalysisProfile;
let analysisProfile2: AnalysisProfile;
let archetype: Archetype;
let targetProfile: TargetProfile;

describe(
  ["@tier3", "@rhsso", "@rhbk"],
  "Architect RBAC operations",
  function () {
    // https://issues.redhat.com/browse/MTA-5631
    const userArchitect = new UserArchitect(getRandomUserData());
    const application = new Application(getRandomApplicationData());
    let profileData: any;
    let sourceData: any;

    before("Creating RBAC users, adding roles for them", function () {
      cy.clearLocalStorage();
      login();
      cy.visit("/");
      AssessmentQuestionnaire.enable(legacyPathfinder);
      stakeholders = createMultipleStakeholders(1);

      tags = createMultipleTags(1);
      archetype = new Archetype(
        `test-archetype-${Date.now()}`,
        [tags[0].name], // Criteria tags
        [tags[0].name] // Archetype tags
      );
      archetype.create();

      cy.fixture("application").then(function (appData) {
        sourceData = appData["bookserver-app"];
      });

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
      application.perform_assessment("low", stakeholders);
      User.loginKeycloakAdmin();
      userArchitect.create();
    });

    beforeEach("Persist session", function () {
      cy.fixture("rbac").then(function (rbacRules) {
        this.rbacRules = rbacRules["architect"];
      });
      userArchitect.login();
    });

    it("Architect, validate create application button", function () {
      Application.validateCreateAppButton(this.rbacRules);
    });

    it("Architect, validate top action menu", function () {
      Analysis.validateTopActionMenu(this.rbacRules);
    });

    it("Architect, validate analyze button", function () {
      Analysis.validateAnalyzeButton(this.rbacRules);
    });

    it("Architect, validate application context menu", function () {
      application.validateAppContextMenu(this.rbacRules);
    });

    it("Architect, validate ability to upload binary", function () {
      application.validateUploadBinary(this.rbacRules);
    });

    it("Architect, validate Analysis Profiles create button", function () {
      AnalysisProfile.validateCreateButton(this.rbacRules);
    });

    it("Architect, Perform analysis using analysis profile", function () {
      login();
      cy.visit("/");

      const appWithArchetype = new Analysis(
        getRandomApplicationData(
          "bookServer_Profile_Analysis",
          { sourceData: sourceData },
          [tags[0].name] // Matches archetype criteria tags
        ),
        profileData
      );
      appWithArchetype.create();

      // Verify both system analysis profiles and analysis profiles linked to app's
      // archetype target profile are available for architect.
      userArchitect.login();
      Application.open();
      appWithArchetype.selectApplication();
      cy.contains(button, "Analyze").should("be.enabled").click();

      // Select analysis profile mode
      cy.get(analysisProfileMode).check().should("be.checked");
      cy.get(analysisProfileSelect).click();

      // Verify the first analysis profile (system profile) is visible
      cy.get(actionMenuItem).should("contain", analysisProfile1.name);
      cy.get(analysisProfileSelect).click();
      cy.contains(button, "Cancel").click(); // Close the Analysis wizard
      appWithArchetype.selectApplication(); // Unselect application

      // Verify the second analysis profile (linked to archetype) is visible;
      // Perform analysis using analysis profile using this profile.
      appWithArchetype.analyze();
      appWithArchetype.waitStatusChange(AnalysisStatuses.scheduled);
      appWithArchetype.verifyAnalysisStatus(
        AnalysisStatuses.completed,
        30 * MIN
      );
      Issues.openSingleApplication(appWithArchetype.name);
      exists("CUSTOM RULE FOR DEPENDENCIES");
    });

    it("Architect, Analysis Profile CRUD operations", function () {
      const crudProfileName = `crud-profile-${Date.now()}`;
      const crudProfile = new AnalysisProfile(
        crudProfileName,
        profileData,
        "Analysis profile for CRUD testing"
      );
      crudProfile.create();
      cy.contains(crudProfileName).should("exist");
      crudProfile.validateAnalysisProfileInformation();

      // Edit the analysis profile
      const updatedDescription = "Updated description for CRUD testing";
      const updatedData: Partial<AnalysisProfile> = {
        description: updatedDescription,
      };
      crudProfile.edit(updatedData);
      cy.contains(crudProfileName).should("exist");

      // Verify the updated description
      crudProfile.description = updatedDescription;
      crudProfile.validateAnalysisProfileInformation();

      crudProfile.delete();
      cy.contains(crudProfileName).should("not.exist");
    });

    it("Architect, Perform analysis in manual mode and save as profile", function () {
      // Architect creates application for analysis
      const appForSaveProfile = new Analysis(
        getRandomApplicationData(
          "app_for_save_profile",
          { sourceData: sourceData },
          [tags[0].name]
        ),
        {
          ...profileData,
          saveAsProfile: true,
        }
      );
      appForSaveProfile.create();

      // Architect performs analysis in manual mode and saves as profile
      appForSaveProfile.analyze();

      // Verify the profile was created with name format: profile_<application_name>
      const expectedProfileName = `profile_${appForSaveProfile.name}`;
      AnalysisProfile.open();
      cy.contains(expectedProfileName).should("exist");

      const createdProfile = new AnalysisProfile(
        expectedProfileName,
        profileData
      );
      createdProfile.delete();
    });

    after("Clean up", function () {
      login();
      cy.visit("/");
      deleteAllMigrationWaves();
      deleteApplicationTableRows();
      if (targetProfile && archetype) {
        targetProfile.open(archetype.name);
        targetProfile.delete();
      }
      if (archetype) {
        archetype.delete();
      }
      if (analysisProfile2) {
        analysisProfile2.delete();
      }
      if (analysisProfile1) {
        analysisProfile1.delete();
      }
      deleteByList(stakeholders);
      deleteByList(tags);
      User.loginKeycloakAdmin();
      userArchitect.delete();
    });
  }
);
