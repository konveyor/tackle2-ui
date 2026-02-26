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
import { randomWordGenerator } from "../../../../../utils/data_utils";
import {
  cleanupDependenciesData,
  clearAllFilters,
  clickWithinByText,
  createMultipleBusinessServices,
  createMultipleStakeholderGroups,
  createMultipleStakeholders,
  createMultipleTags,
  deleteAllMigrationWaves,
  deleteApplicationTableRows,
  deleteByList,
  login,
  seedDependenciesData,
  selectItemsPerPage,
  validatePagination,
  validateSortBy,
} from "../../../../../utils/utils";
import { Analysis } from "../../../../models/migration/applicationinventory/analysis";
import { Application } from "../../../../models/migration/applicationinventory/application";
import { Archetype } from "../../../../models/migration/archetypes/archetype";
import { BusinessServices } from "../../../../models/migration/controls/businessservices";
import { Stakeholdergroups } from "../../../../models/migration/controls/stakeholdergroups";
import { Stakeholders } from "../../../../models/migration/controls/stakeholders";
import { Tag } from "../../../../models/migration/controls/tags";
import { Dependencies } from "../../../../models/migration/dynamic-report/dependencies/dependencies";
import {
  SEC,
  button,
  dependencyFilter,
  trTag,
} from "../../../../types/constants";
import { AppDependency } from "../../../../types/types";
import { rightSideMenu } from "../../../../views/analysis.view";

// Application names created by seedDependenciesData
const bookServerAppName = "DependenciesFilteringApp1";
const dayTraderAppName = "DependenciesFilteringApp2";

let businessServiceList: BusinessServices[];
let archetype: Archetype;
let stakeholders: Stakeholders[];
let stakeholderGroups: Stakeholdergroups[];
let tags: Tag[];
let tagNames: string[];

describe(
  ["@tier3"],
  "Filtering, sorting and pagination in Dependencies",
  () => {
    const sortByList = ["Dependency name", "Language", "Found in"];

    before("Login and seed dependencies data", function () {
      login();
      cy.visit("/");
      deleteAllMigrationWaves();
      deleteApplicationTableRows();
      cleanupDependenciesData();
      seedDependenciesData();

      // Create controls for filtering tests
      businessServiceList = createMultipleBusinessServices(2);
      stakeholders = createMultipleStakeholders(2);
      stakeholderGroups = createMultipleStakeholderGroups(2);
      tags = createMultipleTags(2);
      tagNames = tags.map((tag) => tag.name);
      archetype = new Archetype(
        data.getRandomWord(8),
        [tagNames[0]],
        [tagNames[1]],
        null,
        stakeholders,
        stakeholderGroups
      );
      archetype.create();

      // Associate seeded applications with tags and business services
      const bookServerApp = new Application({ name: bookServerAppName });
      bookServerApp.edit({
        tags: tagNames,
        business: businessServiceList[0].name,
      });

      const dayTraderApp = new Application({ name: dayTraderAppName });
      dayTraderApp.edit({
        business: businessServiceList[1].name,
      });
    });

    beforeEach("Load data", function () {
      cy.fixture("application").then(function (appData) {
        this.appData = appData;
      });
      cy.fixture("analysis").then(function (analysisData) {
        this.analysisData = analysisData;
      });
    });

    it("Filtering dependencies by app name", function () {
      Dependencies.openList(100, true);
      // Applying filter by book server app and validating no dependencies of day trader app showed up
      Dependencies.applyAndValidateFilter(
        dependencyFilter.appName,
        [bookServerAppName],
        this.analysisData["source_analysis_on_bookserverapp"]["dependencies"],
        this.analysisData["source+dep_analysis_on_daytrader-app"][
          "dependencies"
        ]
      );
      clearAllFilters();

      // Applying filter by day trader app and validating no dependencies of book server app showed up
      Dependencies.applyAndValidateFilter(
        dependencyFilter.appName,
        [dayTraderAppName],
        this.analysisData["source+dep_analysis_on_daytrader-app"][
          "dependencies"
        ],
        this.analysisData["source_analysis_on_bookserverapp"]["dependencies"]
      );
      clearAllFilters();
    });

    // https://github.com/konveyor/tackle2-ui/issues/2960
    it("Bug Tackle-2960: Filtering dependencies by Archetype", function () {
      Dependencies.applyFilter(dependencyFilter.archetype, archetype.name);
      this.analysisData["source_analysis_on_bookserverapp"][
        "dependencies"
      ].forEach((dependency: AppDependency) => {
        Dependencies.validateFilter(dependency);
      });
      clearAllFilters();
    });

    it("Filtering dependencies by BS", function () {
      Dependencies.applyFilter(
        dependencyFilter.bs,
        businessServiceList[0].name
      );
      this.analysisData["source_analysis_on_bookserverapp"][
        "dependencies"
      ].forEach((dependency: AppDependency) => {
        Dependencies.validateFilter(dependency);
      });
      clearAllFilters();
    });

    it("Filtering dependencies by tags", function () {
      tagNames.forEach((currentTag: string) => {
        Dependencies.applyFilter(dependencyFilter.tags, currentTag);
        this.analysisData["source_analysis_on_bookserverapp"][
          "dependencies"
        ].forEach((dependency: AppDependency) => {
          Dependencies.validateFilter(dependency);
        });
        clearAllFilters();
      });
    });

    it("Filtering dependencies by dependency name", function () {
      this.analysisData["source_analysis_on_bookserverapp"][
        "dependencies"
      ].forEach((dependency: AppDependency) => {
        Dependencies.applyFilter(dependencyFilter.deppName, dependency.name);
        Dependencies.validateFilter(dependency);
        clearAllFilters();
      });

      // Negative test, filtering by not existing data
      Dependencies.applyFilter(
        dependencyFilter.deppName,
        randomWordGenerator(6)
      );
      cy.get("tr").should("contain", "No data available");
      clearAllFilters();
    });

    it("Filtering dependencies by dependency language", function () {
      this.analysisData["source_analysis_on_bookserverapp"][
        "dependencies"
      ].forEach((dependency: AppDependency) => {
        Dependencies.applyFilter(
          dependencyFilter.language,
          dependency.language
        );
        Dependencies.validateFilter(dependency);
        clearAllFilters();
      });

      // Negative test, filtering by not existing data
      Dependencies.applyFilter(
        dependencyFilter.language,
        randomWordGenerator(6)
      );
      cy.get(trTag).should("contain", "No data available");
      clearAllFilters();
    });

    it("Validate dependencies filter is applied when drilling down from application page", function () {
      // Validation of bug https://issues.redhat.com/browse/MTA-2008
      Analysis.open();
      // Find and click on bookserver app
      cy.contains("td", bookServerAppName).click();
      cy.contains("button", "Details").click();
      clickWithinByText(rightSideMenu, "a", "Dependencies");
      cy.wait(SEC);
      selectItemsPerPage(100);
      cy.contains('[id^="pf-random-id-"]', bookServerAppName);
      cy.contains(button, "Clear all filters");
      this.analysisData["source_analysis_on_bookserverapp"][
        "dependencies"
      ].forEach((dependency: AppDependency) => {
        Dependencies.validateFilter(dependency);
      });
    });

    sortByList.forEach((column) => {
      it(`Sort dependencies by ${column}`, function () {
        Dependencies.openList();
        validateSortBy(column);
      });
    });

    it("Pagination validation", function () {
      Dependencies.openList(10);
      validatePagination();
    });

    after("Perform test data clean up", function () {
      cleanupDependenciesData();
      archetype.delete();
      deleteByList(stakeholders);
      deleteByList(stakeholderGroups);
      deleteByList(tags);
      deleteByList(businessServiceList);
    });
  }
);
