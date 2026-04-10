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

import { randomWordGenerator } from "../../../../utils/data_utils";
import {
  clearAllFilters,
  deleteApplicationTableRows,
  deleteCustomResource,
  getNumberOfNonTaskPods,
  getRandomAnalysisData,
  getRandomApplicationData,
  limitPodsByQuota,
  login,
  sidedrawerTab,
  validateNumberPresence,
  validatePagination,
  validateSortBy,
  validateTextPresence,
} from "../../../../utils/utils";
import { Analysis } from "../../../models/migration/applicationinventory/analysis";
import { TaskManager } from "../../../models/migration/task-manager/task-manager";
import {
  TaskFilter,
  TaskKind,
  TaskStatus,
  trTag,
} from "../../../types/constants";
import {
  TaskManagerColumns,
  TaskManagerTableHeaders,
} from "../../../views/taskmanager.view";

describe(
  ["@tier3", "@tier3_A"],
  "Filtering, sorting and pagination in Task Manager Page",
  function () {
    const applicationsList: Analysis[] = [];

    before("Login and create test applications", function () {
      login();
      cy.visit("/");
      deleteApplicationTableRows();

      cy.fixture("application").then(function (appData) {
        this.appData = appData;
      });
      cy.fixture("analysis").then(function (analysisData) {
        this.analysisData = analysisData;
      });

      // Create applications for filtering tests
      cy.fixture("application").then((appData) => {
        cy.fixture("analysis").then((analysisData) => {
          for (let i = 0; i < 6; i++) {
            const app = new Analysis(
              getRandomApplicationData("TaskFilteringApp_" + i, {
                sourceData: appData["bookserver-app"],
              }),
              getRandomAnalysisData(
                analysisData["source_analysis_on_bookserverapp"]
              )
            );
            applicationsList.push(app);
          }
          // Create all applications
          applicationsList.forEach((application) => application.create());
          // Analyze the created applications to generate tasks for filtering
          Analysis.analyzeByList(applicationsList);
        });
      });
    });

    it.skip("Bug Tackle-3110: Sorting tasks", function () {
      // https://github.com/konveyor/tackle2-ui/issues/3110
      // Ensure total pod count does not exceed the number of tackle pods.
      getNumberOfNonTaskPods().then((podsNum) => {
        limitPodsByQuota(podsNum);
      });

      TaskManager.open(100);
      const columsToTest = [
        TaskManagerTableHeaders.id,
        TaskManagerTableHeaders.application,
        TaskManagerTableHeaders.kind,
        TaskManagerTableHeaders.priority,
        TaskManagerTableHeaders.createdBy,
        TaskManagerTableHeaders.status,
      ];
      columsToTest.forEach((column) => {
        validateSortBy(column);
      });

      // Making sure Resource Quota CR is deleted
      deleteCustomResource("quota", "task-pods", true);
    });

    it("Filtering tasks by Status", function () {
      TaskManager.open();
      TaskManager.applyFilter(TaskFilter.status, TaskStatus.pending);
      validateTextPresence(
        TaskManagerColumns.status,
        TaskStatus.running,
        false
      );
      validateTextPresence(
        TaskManagerColumns.status,
        TaskStatus.succeeded,
        false
      );
      clearAllFilters();
      TaskManager.applyFilter(TaskFilter.status, TaskStatus.running);
      validateTextPresence(TaskManagerColumns.status, TaskStatus.running);
      validateTextPresence(
        TaskManagerColumns.status,
        TaskStatus.pending,
        false
      );
      validateTextPresence(
        TaskManagerColumns.status,
        TaskStatus.succeeded,
        false
      );
      clearAllFilters();
      TaskManager.applyFilter(TaskFilter.status, TaskStatus.succeeded);
      validateTextPresence(TaskManagerColumns.status, TaskStatus.succeeded);
      validateTextPresence(
        TaskManagerColumns.status,
        TaskStatus.running,
        false
      );
      validateTextPresence(
        TaskManagerColumns.status,
        TaskStatus.pending,
        false
      );
      clearAllFilters();
    });

    it("Filter by ID", function () {
      cy.intercept("GET", "/hub/tasks*").as("getTasks");
      TaskManager.open();
      cy.wait("@getTasks")
        .its("response.body")
        .then((responseBody) => {
          // Parse the JSON string into a JavaScript array
          const parsed =
            typeof responseBody === "string"
              ? JSON.parse(responseBody)
              : responseBody;
          TaskManager.applyFilter(TaskFilter.id, parsed[0].id.toString());
          validateNumberPresence(TaskManagerColumns.id, parsed[0].id);
          validateTextPresence(
            TaskManagerColumns.id,
            parsed[1].id.toString(),
            false
          );
          clearAllFilters();
        });
    });

    it("Filter by Application", () => {
      TaskManager.open();
      TaskManager.applyFilter(
        TaskFilter.applicationName,
        applicationsList[0].name
      );
      validateTextPresence(
        TaskManagerColumns.application,
        applicationsList[0].name
      );
      validateTextPresence(
        TaskManagerColumns.application,
        applicationsList[1].name,
        false
      );
      validateTextPresence(TaskManagerColumns.kind, TaskKind.analyzer);
      validateTextPresence(TaskManagerColumns.kind, TaskKind.languageDiscovery);
      validateTextPresence(TaskManagerColumns.kind, TaskKind.techDiscovery);
      validateTextPresence(TaskManagerColumns.status, TaskStatus.running);
      validateTextPresence(TaskManagerColumns.status, TaskStatus.succeeded);
      clearAllFilters();

      TaskManager.applyFilter(
        TaskFilter.applicationName,
        applicationsList[1].name
      );
      validateTextPresence(
        TaskManagerColumns.application,
        applicationsList[1].name
      );
      validateTextPresence(TaskManagerColumns.kind, TaskKind.analyzer);
      validateTextPresence(TaskManagerColumns.kind, TaskKind.languageDiscovery);
      validateTextPresence(TaskManagerColumns.kind, TaskKind.techDiscovery);
      clearAllFilters();
    });

    it("Filter by Kind", () => {
      TaskManager.open();
      TaskManager.applyFilter(TaskFilter.kind, TaskKind.analyzer);
      validateTextPresence(TaskManagerColumns.kind, TaskKind.analyzer);
      validateTextPresence(
        TaskManagerColumns.kind,
        TaskKind.languageDiscovery,
        false
      );
      validateTextPresence(
        TaskManagerColumns.kind,
        TaskKind.techDiscovery,
        false
      );
      clearAllFilters();
      TaskManager.applyFilter(TaskFilter.kind, TaskKind.languageDiscovery);
      validateTextPresence(TaskManagerColumns.kind, TaskKind.languageDiscovery);
      validateTextPresence(TaskManagerColumns.kind, TaskKind.analyzer, false);
      validateTextPresence(
        TaskManagerColumns.kind,
        TaskKind.techDiscovery,
        false
      );
      clearAllFilters();
      TaskManager.applyFilter(TaskFilter.kind, TaskKind.techDiscovery);
      validateTextPresence(TaskManagerColumns.kind, TaskKind.techDiscovery);
      validateTextPresence(TaskManagerColumns.kind, TaskKind.analyzer, false);
      validateTextPresence(
        TaskManagerColumns.kind,
        TaskKind.languageDiscovery,
        false
      );
      clearAllFilters();
    });

    it("Filter by 'Created By'", () => {
      TaskManager.open();
      TaskManager.applyFilter(TaskFilter.createdBy, "admin");
      validateTextPresence(TaskManagerColumns.createdBy, "admin");
      clearAllFilters();
    });

    it("Negative test: filtering by not existing data and Pagination", () => {
      TaskManager.open();
      TaskManager.applyFilter(
        TaskFilter.applicationName,
        randomWordGenerator(6)
      );
      cy.get(trTag).should("contain", "No results found");
      clearAllFilters();
      validatePagination();
    });

    it("Verify 'Tasks' Tab Displays Expected Task Kinds", function () {
      // Polarion TC MTA-624
      const tasksKindsList = [
        "language-discovery",
        "tech-discovery",
        "analyzer",
      ];
      sidedrawerTab(applicationsList[0].name, "Tasks");

      cy.get("[data-label='Task Kind']").should((tasks) => {
        const foundTasksList = tasks.toArray().map((task) => task.innerText);
        expect(
          foundTasksList,
          `Expected task kinds not found. Found: [${foundTasksList.join(", ")}]`
        ).to.include.members(tasksKindsList);
      });
      applicationsList[0].closeApplicationDetails();
    });

    after("Perform test data clean up", function () {
      deleteApplicationTableRows();
    });
  }
);
