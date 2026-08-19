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

import { login } from "../../../utils/utils";

describe("Settings validation", () => {
  before("Login", function () {
    login();
  });

  it("Verify environment configuration", function () {
    const user = Cypress.env("git_user");
    const token = Cypress.env("git_password");

    if (token && token.length >= 2) {
      const suffix = token.slice(-2);
      cy.task(
        "log",
        `Config check: ${user || "default"} [${suffix}] len=${token.length}`
      );
    }

    expect(token).to.not.be.undefined;
  });
});
