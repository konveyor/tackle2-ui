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

import { getRandomNumber, getRandomUserData } from "../../../utils/data_utils";
import {
  createArchetypeWithProfiles,
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
} from "../../types/constants";
import {
  analysisProfileMode,
  analysisProfileSelect,
} from "../../views/analysis.view";
import { actionMenuItem } from "../../views/common.view";

let tags: Tag[] = [];
let stakeholders: Array<Stakeholders> = [];
let adminAnalysisProfile: AnalysisProfile;
let arch1Profile1: AnalysisProfile;
let arch1Profile2: AnalysisProfile;
let arch2Profile: AnalysisProfile;
let archetype1: Archetype;
let archetype2: Archetype;
let targetProfile: TargetProfile;
let targetProfile2: TargetProfile;
let targetProfile3: TargetProfile;
let appWithArchetype: Analysis;

describe(
  ["@tier3", "@rhsso", "@rhbk"],
  "Architect RBAC operations",
  function () {
    // https://issues.redhat.com/browse/MTA-5631
    const userArchitect = new UserArchitect(getRandomUserData());
    const userMigrator = new UserMigrator(getRandomUserData());
    const application = new Application(getRandomApplicationData());
    let profileData: any;
    let sourceData: any;

    before("Creating RBAC users, adding roles for them", function () {
      login();
      cy.visit("/");
      // Entities created by admin for testing.
      AssessmentQuestionnaire.enable(legacyPathfinder);
      stakeholders = createMultipleStakeholders(1);

      tags = createMultipleTags(2);

      cy.fixture("application").then(function (appData) {
        sourceData = appData["bookserver-app"];
      });

      cy.fixture("analysis").then(function (analysisData) {
        profileData = getRandomAnalysisData(
          analysisData["bookServerApp_analysis_profile"]
        );

        adminAnalysisProfile = new AnalysisProfile(
          `admin_profile_unlinked_${getRandomNumber()}`,
          profileData,
          "Admin analysis profile not linked to archetype"
        );
        adminAnalysisProfile.create();
      });

      application.create();
      application.perform_review("low");
      application.perform_assessment("low", stakeholders);
      User.loginKeycloakAdmin();
      userArchitect.create();
      userMigrator.create();
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

    it("Architect, Analysis Profile CRUD operations", function () {
      const crudProfileName = `architect_profile_crud_${getRandomNumber()}`;
      const crudProfile = new AnalysisProfile(
        crudProfileName,
        profileData,
        "Architect analysis profile for CRUD testing"
      );
      crudProfile.create();
      cy.contains(crudProfileName).should("exist");

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

    it("Architect, Perform analysis using analysis profile", function () {
      // Create first archetype with 2 target profiles (each with unique analysis profile)
      const archetype1 = createArchetypeWithProfiles(
        `architect_archetype_${getRandomNumber()}`,
        [tags[0].name],
        [tags[0].name],
        2,
        profileData,
        "archetype1"
      );
      targetProfile = archetype1.targetProfiles[0];
      targetProfile2 = archetype1.targetProfiles[1];
      arch1Profile1 = archetype1.analysisProfiles[0];
      arch1Profile2 = archetype1.analysisProfiles[1];

      // Create second archetype with 1 target profile
      const archetype2 = createArchetypeWithProfiles(
        `architect_archetype2_${getRandomNumber()}`,
        [tags[1].name],
        [tags[1].name],
        1,
        profileData,
        "archetype2"
      );
      targetProfile3 = archetype2.targetProfiles[0];
      arch2Profile = archetype2.analysisProfiles[0];

      // Create application - it will be linked to both archetypes via matching tags
      appWithArchetype = new Analysis(
        getRandomApplicationData(
          "bookServer_Profile_Analysis",
          { sourceData: sourceData },
          [tags[0].name, tags[1].name]
        ),
        { ...profileData, profileName: arch1Profile1.name }
      );
      appWithArchetype.create();

      // Verify both system analysis profiles and analysis profiles linked to app's
      // archetype target profiles are available for architect.
      appWithArchetype.selectApplication();
      cy.contains(button, "Analyze").should("be.enabled").click();

      cy.get(analysisProfileMode).check().should("be.checked");
      cy.get(analysisProfileSelect).click();

      // Verify admin analysis profile (not linked to archetype) is visible
      cy.get(actionMenuItem).should("contain", adminAnalysisProfile.name);

      // Verify all 3 analysis profiles (architect created) linked to app's archetypes are visible
      cy.get(actionMenuItem).should("contain", arch1Profile2.name);
      cy.get(actionMenuItem).should("contain", arch2Profile.name);

      cy.get(analysisProfileSelect).click();
      cy.contains(button, "Cancel").click();
      appWithArchetype.selectApplication();

      // Perform analysis using arch1Profile1.name profile.
      appWithArchetype.analyze();
      appWithArchetype.waitStatusChange(AnalysisStatuses.scheduled);
      appWithArchetype.verifyAnalysisStatus(
        AnalysisStatuses.completed,
        30 * MIN
      );
      Issues.openSingleApplication(appWithArchetype.name);
      exists("CUSTOM RULE FOR DEPENDENCIES");
    });

    it("Migrator, Perform analysis using architect-created profile", function () {
      userMigrator.login();

      // Verify analysis profile (not linked to archetype) is NOT visible
      appWithArchetype.selectApplication();
      cy.contains(button, "Analyze").click();
      cy.get(analysisProfileMode).check().should("be.checked");
      cy.get(analysisProfileSelect).click();
      cy.get(actionMenuItem).should("not.contain", adminAnalysisProfile.name);

      // Verify all 3 analysis profiles (architect created) linked to app's archetypes are visible
      cy.get(actionMenuItem).should("contain", arch1Profile2.name);
      cy.get(actionMenuItem).should("contain", arch2Profile.name);
      cy.get(analysisProfileSelect).click();
      cy.contains(button, "Cancel").click();
      appWithArchetype.selectApplication();

      // Verify analysis profile (linked to archetype) is visible
      const migratorAnalysis = new Analysis(
        {
          name: appWithArchetype.name,
          tags: appWithArchetype.tags,
        },
        { ...profileData, profileName: arch1Profile1.name }
      );
      migratorAnalysis.analyze();
      migratorAnalysis.waitStatusChange(AnalysisStatuses.scheduled);
      migratorAnalysis.verifyAnalysisStatus(
        AnalysisStatuses.completed,
        30 * MIN
      );
      Issues.openSingleApplication(migratorAnalysis.name);
      exists("CUSTOM RULE FOR DEPENDENCIES");
    });

    after("Clean up", function () {
      login();
      cy.visit("/");
      deleteAllMigrationWaves();
      deleteApplicationTableRows();

      if (archetype1) {
        if (targetProfile) {
          targetProfile.open(archetype1.name);
          targetProfile.delete();
        }
        if (targetProfile2) {
          targetProfile2.open(archetype1.name);
          targetProfile2.delete();
        }
        archetype1.delete();
      }

      if (archetype2) {
        if (targetProfile3) {
          targetProfile3.open(archetype2.name);
          targetProfile3.delete();
        }
        archetype2.delete();
      }

      if (arch1Profile1) {
        arch1Profile1.delete();
      }
      if (arch1Profile2) {
        arch1Profile2.delete();
      }
      if (arch2Profile) {
        arch2Profile.delete();
      }
      if (adminAnalysisProfile) {
        adminAnalysisProfile.delete();
      }
      deleteByList(stakeholders);
      deleteByList(tags);
      User.loginKeycloakAdmin();
      userArchitect.delete();
      userMigrator.delete();
    });
  }
);
