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
import {
  getRandomCredentialsData,
  getRandomUserData,
} from "../../../utils/data_utils";
import {
  createMultipleTags,
  deleteByList,
  getRandomAnalysisData,
  getRandomApplicationData,
  login,
} from "../../../utils/utils";
import { AssessmentQuestionnaire } from "../../models/administration/assessment_questionnaire/assessment_questionnaire";
import { CredentialsSourceControlUsername } from "../../models/administration/credentials/credentialsSourceControlUsername";
import { User } from "../../models/keycloak/users/user";
import { UserMigrator } from "../../models/keycloak/users/userMigrator";
import { AnalysisProfile } from "../../models/migration/analysis-profiles/analysis-profile";
import { Analysis } from "../../models/migration/applicationinventory/analysis";
import { Application } from "../../models/migration/applicationinventory/application";
import { Archetype } from "../../models/migration/archetypes/archetype";
import { TargetProfile } from "../../models/migration/archetypes/target-profile";
import { Stakeholders } from "../../models/migration/controls/stakeholders";
import {
  CredentialType,
  button,
  legacyPathfinder,
  tdTag,
  trTag,
} from "../../types/constants";

const stakeholdersList: Array<Stakeholders> = [];
const stakeholdersNameList: Array<string> = [];

describe(["@tier3", "@rhsso", "@rhbk"], "Migrator RBAC operations", () => {
  const userMigrator = new UserMigrator(getRandomUserData());
  const application = new Application(getRandomApplicationData());

  const appCredentials = new CredentialsSourceControlUsername(
    getRandomCredentialsData(CredentialType.sourceControl)
  );

  before("Creating RBAC users, adding roles for them", () => {
    cy.clearLocalStorage();
    login();
    cy.visit("/");
    AssessmentQuestionnaire.enable(legacyPathfinder);
    const stakeholder = new Stakeholders(data.getEmail(), data.getFullName());
    stakeholder.create();

    stakeholdersList.push(stakeholder);
    stakeholdersNameList.push(stakeholder.name);

    appCredentials.create();
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

  it("Migrator, verify only archetype-linked analysis profiles are visible in dropdown", function () {
    // Login as admin to set up test data
    login();
    cy.visit("/");

    // Create tags for archetype
    const tags = createMultipleTags(2);

    // Create first analysis profile (not linked to archetype)
    cy.fixture("analysis").then(function (analysisData) {
      const analysisProfile1 = new AnalysisProfile(
        `profile-unlinked-${Date.now()}`,
        getRandomAnalysisData(analysisData["source_analysis_on_bookserverapp"]),
        "Analysis profile not linked to archetype"
      );
      analysisProfile1.create();

      // Create second analysis profile (will be linked to archetype)
      const analysisProfile2 = new AnalysisProfile(
        `profile-linked-${Date.now()}`,
        getRandomAnalysisData(analysisData["source_analysis_on_bookserverapp"]),
        "Analysis profile linked to archetype"
      );
      analysisProfile2.create();

      // Create archetype with criteria tags
      const archetype = new Archetype(
        `test-archetype-${Date.now()}`,
        [tags[0].name], // Criteria tags
        [tags[1].name] // Archetype tags
      );
      archetype.create();

      // Link second analysis profile to archetype via target profile
      const targetProfile = new TargetProfile(
        `target-profile-${Date.now()}`,
        undefined,
        analysisProfile2.name
      );
      targetProfile.create(archetype.name);

      // Create application with matching tags to associate it with the archetype
      const appWithArchetype = new Application({
        name: `app-with-archetype-${Date.now()}`,
        tags: [tags[0].name], // Matches archetype criteria tags
      });
      appWithArchetype.create();

      // Login as migrator and start application analysis
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
      cy.get("#wizard-mode-profile").check();
      cy.get("#wizard-mode-profile").should("be.checked");

      // Click on the analysis profile dropdown
      cy.get("#analysis-profile-select-toggle").click();

      // Verify only the second analysis profile (linked to archetype) is visible
      cy.get("span.pf-v5-c-menu__item-text")
        .contains(analysisProfile2.name)
        .should("be.visible");

      // Verify the first analysis profile (not linked to archetype) is NOT visible
      cy.get("span.pf-v5-c-menu__item-text")
        .contains(analysisProfile1.name)
        .should("not.exist");

      // Close the wizard
      cy.contains(button, "Cancel").click();

      // Clean up as admin
      login();
      cy.visit("/");
      appWithArchetype.delete();
      targetProfile.open(archetype.name);
      targetProfile.delete();
      archetype.delete();
      analysisProfile2.delete();
      analysisProfile1.delete();
      deleteByList(tags);
    });
  });

  after("", () => {
    login();
    cy.visit("/");
    appCredentials.delete();
    deleteByList(stakeholdersList);
    application.delete();
    User.loginKeycloakAdmin();
    userMigrator.delete();
  });
});
