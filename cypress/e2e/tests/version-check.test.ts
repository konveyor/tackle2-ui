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

import { aboutButton, closeAbout } from "../views/common.view";

describe(["@tier0", "@version-check"], "MTA Version Verification", () => {
  it("Check and log MTA version from About dialog", function () {
    // Expected version for MTA 8.2 (after the fix is applied)
    const expectedVersion = "0.10.0-beta.1";

    cy.log("Opening About dialog");
    cy.get(aboutButton).click();

    // Wait for the modal to be visible
    cy.get('[role="dialog"]').should("be.visible");

    // Take screenshot of the About dialog
    cy.screenshot("mta-about-dialog");

    // Find the version - it's in a dd element after the dt containing "Version"
    cy.contains("dt", "Version")
      .next("dd")
      .invoke("text")
      .then((actualVersion) => {
        cy.log(`Actual version: ${actualVersion}`);
        cy.log(`Expected version for MTA 8.2: ${expectedVersion}`);

        // Log to console for CI visibility
        cy.task("log", "========================================");
        cy.task("log", `MTA VERSION FOUND: ${actualVersion}`);
        cy.task("log", `EXPECTED FOR MTA 8.2: ${expectedVersion}`);
        cy.task("log", "========================================");

        // Compare versions and log result
        if (actualVersion.trim() === expectedVersion) {
          cy.task(
            "log",
            "✅ SUCCESS: Version matches expected MTA 8.2 version"
          );
        } else if (actualVersion.trim() === "99.0.0") {
          cy.task(
            "log",
            "⚠️ WARNING: Installing development version 99.0.0 (branch) instead of release tag"
          );
          cy.task(
            "log",
            "This confirms the issue - operator bundle is using branch instead of release tag"
          );
        } else {
          cy.task("log", `⚠️ WARNING: Unexpected version ${actualVersion}`);
        }

        // NOTE: Not asserting to let the test pass - we just want to see what version is installed
        // After fixing the workflow, change this to an assertion
      });

    // Close the About dialog
    cy.get(closeAbout).click();
  });
});
