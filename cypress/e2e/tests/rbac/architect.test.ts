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
let architectAnalysisProfile: AnalysisProfile;
let archetype: Archetype;
let targetProfile: TargetProfile;
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

      tags = createMultipleTags(1);

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
      // Architect creates archetype
      archetype = new Archetype(
        `architect_archetype_${getRandomNumber()}`,
        [tags[0].name], // Criteria tags
        [tags[0].name] // Archetype tags
      );
      archetype.create();

      architectAnalysisProfile = new AnalysisProfile(
        `architect_profile_linked_${getRandomNumber()}`,
        profileData,
        "Architect analysis profile linked to archetype"
      );
      architectAnalysisProfile.create();

      targetProfile = new TargetProfile(
        `architect_target_profile_${getRandomNumber()}`,
        undefined,
        architectAnalysisProfile.name
      );
      targetProfile.create(archetype.name);

      appWithArchetype = new Analysis(
        getRandomApplicationData(
          "bookServer_Profile_Analysis",
          { sourceData: sourceData },
          [tags[0].name]
        ),
        { ...profileData, profileName: architectAnalysisProfile.name }
      );
      appWithArchetype.create();

      // Verify both system analysis profiles and analysis profiles linked to app's
      // archetype target profile are available for architect.
      appWithArchetype.selectApplication();
      cy.contains(button, "Analyze").should("be.enabled").click();

      cy.get(analysisProfileMode).check().should("be.checked");
      cy.get(analysisProfileSelect).click();

      // Verify analysis profile (admin created) is visible
      cy.get(actionMenuItem).should("contain", adminAnalysisProfile.name);
      cy.get(analysisProfileSelect).click();
      cy.contains(button, "Cancel").click();
      appWithArchetype.selectApplication();

      // Verify analysis profile (architect created, linked to archetype) is visible;
      // Perform analysis using this profile.
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
      cy.contains(button, "Cancel").click();
      appWithArchetype.selectApplication();

      // Verify analysis profile (linked to archetype) is visible
      const migratorAnalysis = new Analysis(
        {
          name: appWithArchetype.name,
          tags: appWithArchetype.tags,
        },
        { ...profileData, profileName: architectAnalysisProfile.name }
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

      if (archetype) {
        if (targetProfile) {
          targetProfile.open(archetype.name);
          targetProfile.delete();
        }
        archetype.delete();
      }

      if (architectAnalysisProfile) {
        architectAnalysisProfile.delete();
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
