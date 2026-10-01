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

import { login } from "../../../../utils/utils";
import { AgentRun } from "../../../models/migration/agentic/agent-run";

/**
 * Drive the agentic console the way a user does: pick an agent and an
 * application, submit, and wait for the run to finish.
 *
 * This checks the SHIPPED agent by default. Those agents declare no gateways,
 * which is intentional - Agent.spec.gateways is an allowlist and an empty list
 * constrains nothing - so the run has to name a gateway itself. A console that
 * offers no way to do that posts a run which fails validation immediately with
 * InvalidGateway; tackle2-ui#3605 fixed that by offering every Gateway when
 * the Agent declares none.
 *
 * Requires a Ready Gateway on the cluster and a Hub application whose
 * repository the harness can clone. Override with Cypress env vars:
 * agenticAgent, agenticApplication, agenticGateway, agenticInstructions.
 */
describe(["@agentic"], "Agentic run from the console", () => {
  before("Login", function () {
    login();
  });

  it("starts an agent run that reaches Succeeded", function () {
    AgentRun.create({
      agent: Cypress.env("agenticAgent"),
      application: Cypress.env("agenticApplication"),
      gateway: Cypress.env("agenticGateway"),
      instructions: Cypress.env("agenticInstructions"),
    }).then((created) => {
      // Logged on the passing path too: if the console ever stops offering a
      // Gateway the run could still succeed, and nothing else would record
      // that the field had gone.
      cy.log(
        `run ${created.runName}, target branch ${created.targetBranch}, ` +
          `gateway field offered: ${created.gatewayOffered}`
      );

      AgentRun.waitForTerminalPhase(created.runName).then(
        ({ phase, row, timedOut }) => {
          const explanation = created.gatewayOffered
            ? ""
            : " No Gateway field was offered, so the run carried no " +
              "spec.gateway (see tackle2-ui#3605).";
          const ran = timedOut
            ? "was still running when the test stopped waiting"
            : "did not succeed";

          // Assert the phase cell, while reporting the whole row, so the
          // failure carries the reason without the reason being able to
          // satisfy the assertion.
          expect(
            phase,
            `run ${created.runName} ${ran}. Row: ${row}.${explanation}`
          ).to.equal("Succeeded");
        }
      );
    });
  });
});
