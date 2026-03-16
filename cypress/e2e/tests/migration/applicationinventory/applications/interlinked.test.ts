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
  clickByText,
  clickItemInKebabMenu,
  deleteByListViaAPI,
  deleteFromArrayByIndex,
  getAuthHeaders,
  login,
} from "../../../../../utils/utils";
import { AssessmentQuestionnaire } from "../../../../models/administration/assessment_questionnaire/assessment_questionnaire";
import { Application } from "../../../../models/migration/applicationinventory/application";
import { Archetype } from "../../../../models/migration/archetypes/archetype";
import { BusinessServices } from "../../../../models/migration/controls/businessservices";
import { Stakeholdergroups } from "../../../../models/migration/controls/stakeholdergroups";
import { Stakeholders } from "../../../../models/migration/controls/stakeholders";
import { Tag } from "../../../../models/migration/controls/tags";
import {
  applicationInventory,
  button,
  legacyPathfinder,
} from "../../../../types/constants";
import { businessColumnSelector } from "../../../../views/applicationinventory.view";
import {
  continueButton,
  stakeholdersAndGroupsSelect,
} from "../../../../views/assessment.view";
import { navMenu } from "../../../../views/menu.view";

let stakeholdersList: Array<Stakeholders> = [];
let stakeholderGroupsList: Array<Stakeholdergroups> = [];
const applicationList: Array<Application> = [];
let tagList: Array<Tag> = [];
let businessServicesList: Array<BusinessServices> = [];

describe(
  ["@tier3"],
  "Applications interlinked to tags and business service",
  () => {
    before("Login and Create Test Data", function () {
      login();
      cy.visit("/");
      AssessmentQuestionnaire.deleteAllQuestionnaires();
      AssessmentQuestionnaire.enable(legacyPathfinder);

      getAuthHeaders().then((headers) => {
        Stakeholders.createMultipleViaApi(1, headers).then((sList) => {
          stakeholdersList = sList;
        });

        Stakeholdergroups.createMultipleViaApi(1, headers).then((sgList) => {
          stakeholderGroupsList = sgList;
        });

        BusinessServices.createMultipleViaApi(2, headers).then((bsList) => {
          businessServicesList = bsList;
        });

        Tag.createMultipleViaApi(5, headers).then((tList) => {
          tagList = tList;
        });
      });
    });

    beforeEach("Define interceptors", function () {
      cy.intercept("POST", "/hub/stakeholdergroups*").as(
        "postStakeholdergroups"
      );
      cy.intercept("GET", "/hub/application*").as("getApplication");
    });

    it("Business service, tag update and delete dependency on application", function () {
      let application: Application;
      getAuthHeaders().then((headers) => {
        Application.createViaApi(
          data.getAppName(),
          businessServicesList[0].id,
          [tagList[0].id],
          undefined,
          headers
        ).then((app) => {
          app.business = businessServicesList[0].name;
          app.tags = [tagList[0].name];
          application = app;
          applicationList.push(app);
          Application.open();
          cy.get("@getApplication");

          application.applicationDetailsTab("Tags");
          application.tagAndCategoryExists(tagList[0].name);
          application.closeApplicationDetails();

          // Remove the BS and tags
          application.removeBusinessService();
          tagList[0].delete();
          deleteFromArrayByIndex(tagList, 0);

          clickByText(navMenu, applicationInventory);
          cy.get("@getApplication");

          // Assert that deleted business service is removed from application
          application.getColumnText(businessColumnSelector, "");

          // Assert that deleted tag is removed
          application.applicationDetailsTab("Tags");
          application.noTagExists();
          application.closeApplicationDetails();

          application.edit({
            business: businessServicesList[1].name,
            tags: [tagList[1].name],
          });
          cy.get("@getApplication");

          // Assert that business service is updated
          application.getColumnText(
            businessColumnSelector,
            businessServicesList[1].name
          );

          // Assert that created tag exists
          application.applicationDetailsTab("Tags");
          application.tagAndCategoryExists(tagList[1].name);
          application.closeApplicationDetails();
        });
      });
    });

    it("Stakeholder and stakeholder group delete dependency on application", function () {
      let application: Application;
      getAuthHeaders().then((headers) => {
        Application.createViaApi(
          data.getAppName(),
          undefined,
          undefined,
          undefined,
          headers
        ).then((app) => {
          application = app;
          applicationList.push(app);
          Application.open();
          cy.get("@getApplication");
          application.perform_assessment(
            "low",
            stakeholdersList,
            stakeholderGroupsList
          );
          application.verifyStatus("assessment", "Completed");

          stakeholdersList[0].deleteViaApi(headers);
          deleteFromArrayByIndex(stakeholdersList, 0);
          stakeholderGroupsList[0].deleteViaApi(headers);
          deleteFromArrayByIndex(stakeholderGroupsList, 0);

          clickByText(navMenu, applicationInventory);
          application.selectApplication();
          clickItemInKebabMenu(application.name, "Assess");
          clickByText(button, "Retake");

          cy.get(stakeholdersAndGroupsSelect).should("have.value", "");
          clickByText(button, "Cancel");
          cy.get(continueButton).click();
        });
      });
    });

    it("Validates association application tags to  archetype tags ", function () {
      const archetype = new Archetype(
        data.getRandomWord(8),
        [tagList[2].name, tagList[4].name],
        [tagList[3].name],
        null
      );
      archetype.create();

      getAuthHeaders().then((headers) => {
        Application.createViaApi(
          data.getAppName(),
          undefined,
          [tagList[2].id, tagList[4].id],
          undefined,
          headers
        ).then((app1) => {
          app1.tags = [tagList[2].name, tagList[4].name];
          applicationList.push(app1);

          Application.createViaApi(
            data.getAppName(),
            undefined,
            [tagList[2].id, tagList[3].id],
            undefined,
            headers
          ).then((app2) => {
            app2.tags = [tagList[2].name, tagList[3].name];
            applicationList.push(app2);

            Application.createViaApi(
              data.getAppName(),
              undefined,
              [tagList[2].id, tagList[4].id],
              undefined,
              headers
            ).then((app3) => {
              app3.tags = [tagList[2].name, tagList[4].name];
              applicationList.push(app3);

              Application.open();
              const applications = [app1, app2, app3];

              applications.forEach((application) => {
                cy.get("@getApplication");
                application.applicationDetailsTab("Tags");
                application.tags.forEach((tag) => {
                  application.tagAndCategoryExists(tag);
                });
                application.closeApplicationDetails();
              });

              archetype.getAssociatedAppsCount().then((appCount) => {
                expect(appCount).to.equal(2);
              });
              archetype.delete();
            });
          });
        });
      });
    });

    after("Perform test data clean up", function () {
      getAuthHeaders().then((headers) => {
        deleteByListViaAPI(applicationList, headers);
        tagList.forEach((tag) => {
          tag.deleteViaApi(headers, true);
        });
        deleteByListViaAPI(businessServicesList, headers);
        deleteByListViaAPI(stakeholdersList, headers);
        deleteByListViaAPI(stakeholderGroupsList, headers);
      });
    });
  }
);
