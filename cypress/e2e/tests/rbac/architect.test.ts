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

import {
  getRandomCredentialsData,
  getRandomUserData,
} from "../../../utils/data_utils";
import {
  createMultipleStakeholders,
  deleteByList,
  exists,
  getRandomAnalysisData,
  getRandomApplicationData,
  login,
} from "../../../utils/utils";
import { AssessmentQuestionnaire } from "../../models/administration/assessment_questionnaire/assessment_questionnaire";
import { CredentialsSourceControlUsername } from "../../models/administration/credentials/credentialsSourceControlUsername";
import { User } from "../../models/keycloak/users/user";
import { UserArchitect } from "../../models/keycloak/users/userArchitect";
import { AnalysisProfile } from "../../models/migration/analysis-profiles/analysis-profile";
import { Analysis } from "../../models/migration/applicationinventory/analysis";
import { Application } from "../../models/migration/applicationinventory/application";
import { TargetProfile } from "../../models/migration/archetypes/target-profile";
import { Stakeholders } from "../../models/migration/controls/stakeholders";
import {
  AnalysisStatuses,
  CredentialType,
  MIN,
  button,
  legacyPathfinder,
} from "../../types/constants";
import {
  analysisProfileMode,
  analysisProfileSelect,
} from "../../views/analysis.view";
import { actionMenuItem } from "../../views/common.view";

let stakeholders: Array<Stakeholders> = [];
let analysisProfile1: AnalysisProfile;
let analysisProfile2: AnalysisProfile;
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

    const appCredentials = new CredentialsSourceControlUsername(
      getRandomCredentialsData(CredentialType.sourceControl)
    );

    before("Creating RBAC users, adding roles for them", function () {
      cy.clearLocalStorage();
      login();
      cy.visit("/");
      AssessmentQuestionnaire.enable(legacyPathfinder);
      stakeholders = createMultipleStakeholders(1);

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

      appCredentials.create();
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

      // Verify only analysis profiles linked to app's archetype target profile are available
      // and that system analysis profiles are not available for migrator.
      userArchitect.login();
      Application.open();
      appWithArchetype.selectApplication();
      cy.contains(button, "Analyze").should("be.enabled").click();

      // Select analysis profile mode
      cy.get(analysisProfileMode).check().should("be.checked");
      cy.get(analysisProfileSelect).click();

      // Verify the first analysis profile (not linked to archetype) is NOT visible
      cy.get(actionMenuItem).should("not.contain", analysisProfile1.name);

      // Verify only the second analysis profile (linked to archetype) is visible
      // Perform analysis using analysis profile
      cy.get(actionMenuItem)
        .contains(analysisProfile2.name)
        .should("be.visible")
        .click();
      next();
      next();
      clickByText(button, "Run");
      appWithArchetype.waitStatusChange(AnalysisStatuses.scheduled);
      appWithArchetype.verifyAnalysisStatus(
        AnalysisStatuses.completed,
        30 * MIN
      );
      Issues.openSingleApplication(appWithArchetype.name);
      exists("CUSTOM RULE FOR DEPENDENCIES");
    });

    after("Clean up", function () {
      login();
      cy.visit("/");
      appCredentials.delete();
      deleteByList(stakeholders);
      application.delete();
      User.loginKeycloakAdmin();
      userArchitect.delete();
    });
  }
);
