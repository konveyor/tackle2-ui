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

import * as data from "../../utils/data_utils";
import {
  checkSuccessAlert,
  exists,
  getApplicationID,
  getAuthHeaders,
  getRandomAnalysisData,
  getRandomApplicationData,
  notExists,
  seedAnalysisData,
} from "../../utils/utils";
import { AssessmentQuestionnaire } from "../models/administration/assessment_questionnaire/assessment_questionnaire";
import { Analysis } from "../models/migration/applicationinventory/analysis";
import { Archetype } from "../models/migration/archetypes/archetype";
import { BusinessServices } from "../models/migration/controls/businessservices";
import { Jobfunctions } from "../models/migration/controls/jobfunctions";
import { Stakeholdergroups } from "../models/migration/controls/stakeholdergroups";
import { Stakeholders } from "../models/migration/controls/stakeholders";
import { TagCategory } from "../models/migration/controls/tagcategory";
import { Tag } from "../models/migration/controls/tags";
import { SEC, legacyPathfinder } from "../types/constants";
import { infoAlertMessage, successAlertMessage } from "../views/common.view";

let stakeholders: Stakeholders[];
let stakeholderGroups: Stakeholdergroups[];
let tagCategories: TagCategory[];
let tags: Tag[];

// Shorter timeout for alert checks in CI — 15 s instead of the 150 s default.
// Alerts auto-dismiss quickly; a long timeout just delays failure diagnosis.
const CI_ALERT_TIMEOUT = 15 * SEC;

describe(["@ci"], "UI Sanity Tests", () => {
  beforeEach("Load fixtures", function () {
    cy.fixture("application").then(function (appData) {
      this.appData = appData;
    });
    cy.fixture("analysis").then(function (analysisData) {
      this.analysisData = analysisData;
    });
  });

  it("Business service CRUD", function () {
    const businessService = new BusinessServices(
      data.getCompanyName(),
      data.getDescription()
    );
    businessService.create();
    exists(businessService.name);

    const updatedBusinessServiceName = data.getCompanyName();
    businessService.edit({ name: updatedBusinessServiceName });
    exists(updatedBusinessServiceName);

    // delete() internally waits for the DELETE response and calls notExists()
    businessService.delete();
  });

  it("Jobfunction CRUD", function () {
    const jobfunction = new Jobfunctions("xGoPhT");
    jobfunction.create();
    exists(jobfunction.name, undefined, Jobfunctions.openList);

    const updatedJobfuncName = data.getJobTitle();
    jobfunction.edit(updatedJobfuncName);
    exists(updatedJobfuncName, undefined, Jobfunctions.openList);

    // delete() internally waits for the DELETE response and calls notExists()
    jobfunction.delete();
  });

  it("Stakeholder , Stakeholder Group , Tag and Archetype CRUD operations", function () {
    // Automates Polarion MTA-395
    // Create prerequisite entities via API to avoid UI navigation overhead.
    // Dedicated CRUD tests for these models live in their own test files.
    stakeholders = [];
    stakeholderGroups = [];
    tagCategories = [];
    tags = [];

    getAuthHeaders().then((headers) => {
      Stakeholders.createViaApi(
        data.getEmail(),
        data.getFullName(),
        headers
      ).then((s) => stakeholders.push(s));
      Stakeholders.createViaApi(
        data.getEmail(),
        data.getFullName(),
        headers
      ).then((s) => stakeholders.push(s));
      Stakeholdergroups.createViaApi(
        data.getCompanyName(),
        data.getDescription(),
        headers
      ).then((sg) => stakeholderGroups.push(sg));
      Stakeholdergroups.createViaApi(
        data.getCompanyName(),
        data.getDescription(),
        headers
      ).then((sg) => stakeholderGroups.push(sg));

      // Tags require a parent TagCategory
      TagCategory.createViaApi(
        data.getRandomWord(8),
        data.getColor(),
        headers
      ).then((tc) => {
        tagCategories.push(tc);
        Tag.createViaApi(data.getRandomWord(6), tc.id, tc.name, headers).then(
          (t) => tags.push(t)
        );
      });
      TagCategory.createViaApi(
        data.getRandomWord(8),
        data.getColor(),
        headers
      ).then((tc) => {
        tagCategories.push(tc);
        Tag.createViaApi(data.getRandomWord(6), tc.id, tc.name, headers).then(
          (t) => tags.push(t)
        );
      });
    });

    // Archetype CRUD is the actual UI test
    cy.then(() => {
      const archetype = new Archetype(
        data.getRandomWord(8),
        [tags[0].name],
        [tags[1].name],
        null,
        stakeholders,
        stakeholderGroups
      );
      cy.intercept("POST", "/hub/archetypes*").as("postArchetype");
      archetype.create();
      cy.wait("@postArchetype");
      checkSuccessAlert(
        successAlertMessage,
        `Success alert:Archetype ${archetype.name} was successfully created.`,
        true,
        CI_ALERT_TIMEOUT
      );
      exists(archetype.name);

      const updatedArchetypeName = data.getRandomWord(8);
      // edit() internally waits for the PUT response
      archetype.edit({ name: updatedArchetypeName });
      checkSuccessAlert(
        successAlertMessage,
        `Success alert:Archetype was successfully saved.`,
        true,
        CI_ALERT_TIMEOUT
      );
      exists(updatedArchetypeName);

      // delete() internally waits for the DELETE response
      archetype.delete();
      checkSuccessAlert(
        successAlertMessage,
        `Success alert:Archetype ${archetype.name} was successfully deleted.`,
        true,
        CI_ALERT_TIMEOUT
      );
      notExists(archetype.name);
    });

    // Clean up prerequisite entities via API
    getAuthHeaders().then((headers) => {
      tags.forEach((t) => t.deleteViaApi(headers));
      tagCategories.forEach((tc) => tc.deleteViaApi(headers));
      stakeholderGroups.forEach((sg) => sg.deleteViaApi(headers));
      stakeholders.forEach((s) => s.deleteViaApi(headers));
    });
  });

  it("Application assessment, review, analyze and validate efforts and issues", function () {
    AssessmentQuestionnaire.deleteAllQuestionnaires();
    AssessmentQuestionnaire.enable(legacyPathfinder);

    // Create stakeholder via API — it's only needed as assessment input
    stakeholders = [];
    getAuthHeaders().then((headers) => {
      Stakeholders.createViaApi(
        data.getEmail(),
        data.getFullName(),
        headers
      ).then((s) => stakeholders.push(s));
    });

    cy.then(() => {
      const application = new Analysis(
        getRandomApplicationData("ci_testApp", {
          sourceData: this.appData["bookserver-app"],
        }),
        getRandomAnalysisData(this.analysisData["imported_data_for_ci_test"])
      );
      cy.intercept("GET", "/hub/application*").as("getApplication");
      application.create();
      cy.wait("@getApplication");

      // Perform assessment of application
      application.perform_assessment("low", stakeholders);
      application.verifyStatus("assessment", "Completed");

      // Perform application review
      application.perform_review("low");
      application.verifyStatus("review", "Completed");

      // TO DO - Uncomment once bug https://issues.redhat.com/browse/MTA-5794 is fixed.
      // application.validateReviewFields();

      application.analyze();
      checkSuccessAlert(
        infoAlertMessage,
        `Submitted for analysis`,
        false,
        CI_ALERT_TIMEOUT
      );

      application.selectApplicationRow();
      cy.url().then((currentUrl) => {
        const id = getApplicationID(currentUrl);
        cy.log(`Current URL: ${currentUrl}`);
        cy.log(`Extracted ID: ${id}`);
        if (id == null || id <= 0) {
          throw new Error(
            `Failed to extract a valid application ID from URL: ${currentUrl}`
          );
        }
        seedAnalysisData(id);
      });
      application.verifyEffort(
        this.analysisData["imported_data_for_ci_test"]["effort"]
      );
      application.validateIssues(
        this.analysisData["imported_data_for_ci_test"]["issues"]
      );
      application.delete();
    });

    // Clean up stakeholder via API
    getAuthHeaders().then((headers) => {
      stakeholders.forEach((s) => s.deleteViaApi(headers));
    });
  });

  after("Clean up all test data via API", function () {
    // Delete in dependency order: applications, archetypes, then base entities
    const endpoints = [
      "/hub/applications",
      "/hub/archetypes",
      "/hub/stakeholdergroups",
      "/hub/stakeholders",
      "/hub/tagcategories",
      "/hub/jobfunctions",
      "/hub/businessservices",
    ];

    getAuthHeaders().then((headers) => {
      endpoints.forEach((endpoint) => {
        cy.request({
          method: "GET",
          url: endpoint,
          headers,
          failOnStatusCode: false,
        }).then((res) => {
          const items = Array.isArray(res.body) ? res.body : [];
          items.forEach((item: { id: number }) => {
            cy.request({
              method: "DELETE",
              url: `${endpoint}/${item.id}`,
              headers,
              failOnStatusCode: false,
            });
          });
        });
      });
    });
  });
});
