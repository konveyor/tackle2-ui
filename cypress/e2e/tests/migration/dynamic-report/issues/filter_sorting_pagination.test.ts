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

import { randomWordGenerator } from "../../../../../utils/data_utils";
import {
  cleanupIssuesData,
  clearAllFilters,
  clickByText,
  deleteAllMigrationWaves,
  deleteApplicationTableRows,
  getUniqueNamesMap,
  login,
  seedIssuesData,
  selectItemsPerPage,
  validatePagination,
  validateSortBy,
} from "../../../../../utils/utils";
import { Issues } from "../../../../models/migration/dynamic-report/issues/issues";
import {
  SEC,
  dynamicReportFilter,
  tdTag,
  trTag,
} from "../../../../types/constants";
import { AppIssue } from "../../../../types/types";
import { rightSideBar } from "../../../../views/issue.view";

describe(
  ["@tier3"],
  "Filtering, sorting and pagination in Issues",
  function () {
    // Application names created by seedIssuesData
    const bookserverAppNames = [
      "IssuesFilteringApp1_0",
      "IssuesFilteringApp1_1",
      "IssuesFilteringApp1_2",
    ];
    const coolstoreAppNames = ["IssuesFilteringApp2_0"];
    const archetypeName = "IssuesArchetype";
    const businessServiceNames = [
      "BookServer Business Service",
      "Coolstore Business Service",
    ];
    const tagNames = ["EJB XML", "Entity Bean"];

    const allIssuesSortByList = ["Issue", "Category", "Affected applications"];
    const affectedApplicationSortByList = [
      "Name",
      "Business service",
      "Effort",
      "Incidents",
    ];
    const singleApplicationSortByList = ["Issue", "Category", "Affected files"];
    const affectedFilesSortByList = ["File", "Incidents", "Effort"];

    before("Login", function () {
      Cypress.session.clearAllSavedSessions();
      login();
      cy.visit("/");
      deleteAllMigrationWaves();
      deleteApplicationTableRows();
      cleanupIssuesData();
      seedIssuesData();
    });

    beforeEach("Load data", function () {
      cy.fixture("application").then(function (appData) {
        this.appData = appData;
      });
      cy.fixture("analysis").then(function (analysisData) {
        this.analysisData = analysisData;
      });
      cy.intercept("GET", "/hub/analyses/report/rules*").as("getIssues");
      cy.intercept("GET", "hub/analyses/report/issues/applications*").as(
        "getApplications"
      );
    });

    it("All issues - Filtering issues by name", function () {
      const bookServerIssues =
        this.analysisData["source_analysis_on_bookserverapp"]["issues"];
      const coolstoreIssues =
        this.analysisData["source+dep_on_coolStore_app"]["issues"];

      Issues.openList(100, true);
      Issues.applyAndValidateFilter(
        dynamicReportFilter.applicationName,
        [bookserverAppNames[0]],
        bookServerIssues,
        coolstoreIssues
      );
      clearAllFilters();

      Issues.applyAndValidateFilter(
        dynamicReportFilter.applicationName,
        [coolstoreAppNames[0]],
        coolstoreIssues,
        bookServerIssues
      );
      clearAllFilters();
    });

    it("All issues - filtering by multiple names", function () {
      const bookServerIssues =
        this.analysisData["source_analysis_on_bookserverapp"]["issues"];
      const coolstoreIssues =
        this.analysisData["source+dep_on_coolStore_app"]["issues"];

      Issues.applyMultiFilter(dynamicReportFilter.applicationName, [
        bookserverAppNames[0],
        coolstoreAppNames[0],
      ]);
      Issues.validateMultiFilter(
        getUniqueNamesMap([bookServerIssues, coolstoreIssues])
      );
      clearAllFilters();
    });

    it("All issues - Filtering issues by Archetype", function () {
      Issues.applyFilter(dynamicReportFilter.archetype, archetypeName);
      this.analysisData["source+dep_on_coolStore_app"]["issues"].forEach(
        (issue: AppIssue) => {
          Issues.validateFilter(issue);
        }
      );
      clearAllFilters();
    });

    it("All issues - Filtering issues by BS", function () {
      Issues.applyFilter(dynamicReportFilter.bs, businessServiceNames[0]);
      this.analysisData["source_analysis_on_bookserverapp"]["issues"].forEach(
        (issue: AppIssue) => {
          Issues.validateFilter(issue);
        }
      );
      clearAllFilters();
    });

    it("All issues - Filtering issues by tags", function () {
      tagNames.forEach((currentTag: string) => {
        Issues.applyFilter(dynamicReportFilter.tags, currentTag);
        this.analysisData["source+dep_on_coolStore_app"]["issues"].forEach(
          (issue: AppIssue) => {
            Issues.validateFilter(issue);
          }
        );
        clearAllFilters();
      });
    });

    it("All issues - Filtering issues by category", function () {
      this.analysisData["source_analysis_on_bookserverapp"]["issues"].forEach(
        (issue: AppIssue) => {
          Issues.applyFilter(dynamicReportFilter.category, issue.category);
          Issues.validateFilter(issue);
          clearAllFilters();
        }
      );

      // Negative test, filtering by not existing data
      Issues.applyFilter(dynamicReportFilter.category, randomWordGenerator(6));
      cy.get("tr").should("contain", "No data available");
      clearAllFilters();
    });

    it("All issues - Filtering issues by source", function () {
      this.analysisData["source_analysis_on_bookserverapp"]["issues"].forEach(
        (issue: AppIssue) => {
          issue.sources.forEach((source) => {
            Issues.applyFilter(dynamicReportFilter.source, source);
            Issues.validateFilter(issue);
            clearAllFilters();
          });
        }
      );

      // Negative test, filtering by not existing data
      Issues.applyFilter(dynamicReportFilter.source, randomWordGenerator(6));
      cy.get("tr").should("contain", "No data available");
      clearAllFilters();
    });

    it("All issues - Filtering issues by target", function () {
      const issues =
        this.analysisData["source_analysis_on_bookserverapp"]["issues"];
      issues.forEach((issue: AppIssue) => {
        issue.targets.forEach((target: string) => {
          Issues.applyFilter(dynamicReportFilter.target, target);
          Issues.validateFilter(issue);
          clearAllFilters();
        });
      });

      // Negative test, filtering by not existing data
      Issues.applyFilter(dynamicReportFilter.target, randomWordGenerator(6));
      cy.get(trTag).should("contain", "No data available");
      clearAllFilters();
    });

    allIssuesSortByList.forEach((column) => {
      it(`All issues - Sort issues by ${column}`, function () {
        Issues.openList();
        selectItemsPerPage(100);
        validateSortBy(column);
      });
    });

    it("All issues - Sorting affected files", function () {
      Issues.openAffectedApplications(
        this.analysisData["source+dep_on_coolStore_app"]["issues"][0]["name"]
      );
      clickByText(tdTag, coolstoreAppNames[0]);
      cy.get(rightSideBar).within(() => {
        affectedFilesSortByList.forEach((column) => {
          validateSortBy(column);
        });
      });
    });

    it("All issues - Pagination validation", function () {
      Issues.openList(10);
      validatePagination();
    });

    affectedApplicationSortByList.forEach((column) => {
      it(`Affected applications - sort by ${column}`, function () {
        Issues.openAffectedApplications(
          this.analysisData["source_analysis_on_bookserverapp"]["issues"][0][
            "name"
          ]
        );
        // Wait up to 3 sec until spinner will be away
        cy.get("div.pf-v5-l-bullseye", { timeout: 3 * SEC }).should(
          "not.exist"
        );
        selectItemsPerPage(100);
        validateSortBy(column);
      });
    });

    it("Single application - filtering issues by category", function () {
      Issues.openSingleApplication(bookserverAppNames[0]);
      selectItemsPerPage(100);
      this.analysisData["source_analysis_on_bookserverapp"]["issues"].forEach(
        (issue: AppIssue) => {
          Issues.applyFilter(
            dynamicReportFilter.category,
            issue.category,
            true
          );
          Issues.validateFilter(issue, true);
          clearAllFilters();
        }
      );
    });

    it("Single application - filtering issues by source", function () {
      Issues.openSingleApplication(bookserverAppNames[0]);
      selectItemsPerPage(100);
      this.analysisData["source_analysis_on_bookserverapp"]["issues"].forEach(
        (issue: AppIssue) => {
          issue.sources.forEach((source) => {
            Issues.applyFilter(dynamicReportFilter.source, source, true);
            Issues.validateFilter(issue, true);
            clearAllFilters();
          });
        }
      );
    });

    it("Single application - filtering issues by target", function () {
      Issues.openSingleApplication(bookserverAppNames[0]);
      selectItemsPerPage(100);
      const issues =
        this.analysisData["source_analysis_on_bookserverapp"]["issues"];
      issues.forEach((issue: AppIssue) => {
        issue.targets.forEach((target: string) => {
          Issues.applyFilter(dynamicReportFilter.target, target, true);
          Issues.validateFilter(issue, true);
          clearAllFilters();
        });
      });
    });

    singleApplicationSortByList.forEach((column) => {
      it(`Single application - sort by ${column}`, function () {
        Issues.openSingleApplication(bookserverAppNames[0]);
        validateSortBy(column);
      });
    });

    after("Perform test data clean up", function () {
      cleanupIssuesData();
    });
  }
);
