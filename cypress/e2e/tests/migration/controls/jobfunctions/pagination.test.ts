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
  itemsPerPageValidation,
  login,
  selectItemsPerPage,
  validatePagination,
} from "../../../../../utils/utils";
import { Jobfunctions } from "../../../../models/migration/controls/jobfunctions";

describe(["@tier3"], "Job functions pagination validations", function () {
  before("Login and Create Test Data", function () {
    login();

    for (let i = 0; i < 11; i++) {
      Jobfunctions.createViaApi(data.getFullName());
    }
  });

  it("Navigation button validations", function () {
    Jobfunctions.openList();
    selectItemsPerPage(10);
    validatePagination();
  });

  it("Items per page validations", function () {
    Jobfunctions.openList();
    selectItemsPerPage(10);
    itemsPerPageValidation();
  });

  after("Perform test data clean up", function () {
    Jobfunctions.deleteAllViaApi();
  });
});
