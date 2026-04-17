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

import * as data from "../../../../utils/data_utils";
import {
  applySearchFilter,
  clickByText,
  createMultipleMigrationWaves,
  deleteByList,
  login,
} from "../../../../utils/utils";
import { MigrationWave } from "../../../models/migration/migration-waves/migration-wave";
import { button, clearAllFilters } from "../../../types/constants";
import { categoryName } from "../../../types/filter-categories";
import { MigrationWaveView } from "../../../views/migration-wave.view";

let migrationWavesList: Array<MigrationWave> = [];
//Automates Polarion TC 343
describe(
  ["@tier3", "@tier3_D"],
  "Migration waves filter validations",
  function () {
    before("Login and Create Test Data", function () {
      login();
      cy.visit("/");
      migrationWavesList = createMultipleMigrationWaves(2);
    });

    it("Name filter validations", function () {
      MigrationWave.open();

      // Enter an existing display name substring and assert
      const validSearchInput = migrationWavesList[0].name.substring(0, 3);
      applySearchFilter(categoryName, validSearchInput);
      cy.get("td").should("contain", migrationWavesList[0].name);
      if (migrationWavesList[1].name.indexOf(validSearchInput) >= 0) {
        cy.get("td").should("contain", migrationWavesList[1].name);
      }
      clickByText(button, clearAllFilters);

      // Enter an existing exact name and assert
      applySearchFilter(categoryName, migrationWavesList[1].name);
      cy.get("td").should("contain", migrationWavesList[1].name);
      cy.get("td").should("not.contain", migrationWavesList[0].name);
      clickByText(button, clearAllFilters);

      // Enter a non-existing name substring and apply it as search filter
      applySearchFilter(categoryName, String(data.getRandomNumber()));

      // Assert that no search results are found
      cy.get(MigrationWaveView.migrationWavesTable)
        .find("h2")
        .should("contain", "No migration waves available");
      clickByText(button, clearAllFilters);
    });

    after("Perform test data clean up", function () {
      deleteByList(migrationWavesList);
    });
  }
);
