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
import {
  agentRunsPath,
  createRunAgent,
  createRunApplication,
  createRunButton,
  createRunForm,
  createRunGateway,
  createRunInstructions,
  createRunSubmit,
  createRunTargetBranch,
  runNameFromPath,
  runRowPhase,
} from "../../../views/agentic.view";

export interface AgentRunOptions {
  /** Agent to run. Defaults to a shipped one, which declares no gateways. */
  agent?: string;
  /**
   * Application option value - the Hub application id as a string. Defaults
   * to the first the console offers, since an id is not stable across
   * clusters.
   */
  application?: string;
  /** Gateway label to pick. Defaults to the first real option offered. */
  gateway?: string;
  instructions?: string;
}

/** What the create-run modal offered, which is itself part of the result. */
export interface CreateRunOutcome {
  runName: string;
  /**
   * False when the console rendered no Gateway field. For an Agent that
   * declares no gateways that is tackle2-ui#3605: the run is posted without
   * spec.gateway and the controller rejects it with InvalidGateway. Recorded
   * rather than asserted so the failure surfaces as the run's own reason.
   */
  gatewayOffered: boolean;
  targetBranch: string;
}

const TERMINAL = /Succeeded|Failed/;

/**
 * Pick an option by value, or the first real one when no value is given.
 *
 * Every select in this modal leads with an empty placeholder, so "the first
 * option" is never the right answer. An empty select means the cluster is
 * missing something rather than the console being broken - no Gateway CR, no
 * Hub application - so say which, because the alternative is a test that
 * fails on a selector and blames the UI.
 */
function selectOption(selector: string, label: string, value?: string) {
  if (value) {
    cy.get(selector).select(value);
    return;
  }
  // Wait for a real option before reading the list. Every select here leads
  // with a placeholder, so one option means the query behind it has not
  // landed yet - and snapshotting at that moment would report the cluster as
  // missing a prerequisite when it is only slower than the agent query.
  cy.get(`${selector} option`, { timeout: 60_000 })
    .should("have.length.greaterThan", 1)
    .then(($options) => {
      // Non-Ready gateways and agents render disabled, and Cypress refuses to
      // select those - an error that would read as a broken test rather than
      // as a cluster with nothing usable on it.
      const usable = $options
        .toArray()
        .filter(
          (o) =>
            (o as HTMLOptionElement).value !== "" &&
            !(o as HTMLOptionElement).disabled
        )
        .map((o) => (o as HTMLOptionElement).value);
      if (usable.length === 0) {
        throw new Error(
          `the create-run modal offered no selectable ${label}. Every option ` +
            `was a placeholder or disabled, which is a cluster prerequisite ` +
            `rather than a UI failure.`
        );
      }
      cy.get(selector).select(usable[0]);
    });
}

export class AgentRun {
  /** Start a run from the console and return what the modal offered. */
  static create(
    options: AgentRunOptions = {}
  ): Cypress.Chainable<CreateRunOutcome> {
    const agent = options.agent ?? "migration-plan-agent";
    const instructions =
      options.instructions ??
      "List the top-level files in the repository, then name the build tool " +
        "this project uses. One sentence.";

    cy.visit(agentRunsPath);
    cy.contains("button", createRunButton).click();
    cy.get(createRunAgent).should("exist").select(agent);

    // Whether the Gateway field renders depends on the Agent just selected.
    // Absence can only be observed, never waited on, so the observation has to
    // happen after the agent-dependent render - and the select reporting the
    // new value is a retryable proof that React processed the change and
    // re-rendered, which "the form exists" is not.
    cy.get(createRunAgent).should("have.value", agent);

    return cy.get(createRunForm).then(($form) => {
      const gatewayOffered = $form.find(createRunGateway).length > 0;
      if (gatewayOffered) {
        selectOption(createRunGateway, "Gateway", options.gateway);
      }

      // The application field is a plain span when the run was opened from an
      // application, and a select only when one still has to be chosen.
      if ($form.find(`select${createRunApplication}`).length > 0) {
        selectOption(createRunApplication, "application", options.application);
      }

      // Instructions are caller-supplied, so braces must not be read as
      // Cypress key sequences.
      cy.get(createRunInstructions)
        .clear()
        .type(instructions, { parseSpecialCharSequences: false });

      return cy
        .get(createRunTargetBranch)
        .invoke("val")
        .then((targetBranch) => {
          cy.get(createRunSubmit).should("be.enabled").click();

          // Creating a run navigates to its detail page, which is where the
          // generated name can be read.
          return cy
            .location("pathname")
            .should("match", runNameFromPath)
            .then((pathname) => {
              const matched = String(pathname).match(runNameFromPath);
              if (!matched) {
                throw new Error(
                  `expected to land on a run detail page, got ${pathname}`
                );
              }
              return {
                runName: matched[1],
                gatewayOffered,
                targetBranch: String(targetBranch ?? ""),
              };
            });
        });
    });
  }

  /**
   * Poll the runs table until the run reaches a terminal phase, and return the
   * whole row. The table is used rather than the detail page because the Phase
   * and Reason columns are discrete values there, and the row text is what
   * makes a failure message self-explaining.
   */
  static waitForTerminalPhase(
    runName: string,
    timeoutMinutes = 12
  ): Cypress.Chainable<{ phase: string; row: string; timedOut: boolean }> {
    const intervalMs = 10_000;
    const attempts = Math.ceil((timeoutMinutes * 60_000) / intervalMs);

    const poll = (
      remaining: number
    ): Cypress.Chainable<{ phase: string; row: string; timedOut: boolean }> => {
      cy.visit(agentRunsPath);
      return (
        cy
          // Generously, because this follows a full page load: at the default
          // command timeout one slow render ends the poll and reports a run
          // that is merely still going as failed.
          .contains("tr", runName, { timeout: 60_000 })
          .find("td")
          .then(($cells) => {
            // The phase is read from its own cell. Matched against the joined
            // row, a run name, an application or a reason carrying the word
            // would end the poll early or satisfy the success assertion.
            const phase = $cells.filter(runRowPhase).text().trim();
            // Join the cells rather than taking the row's text: the row runs
            // them together, so a failure reads "ui-6zkldmigration-plan-agent
            // #1FailedFailed21s12s" and the phase and reason are impossible to
            // pick out of it.
            const text = $cells
              .toArray()
              .map((cell) => cell.innerText.trim())
              .filter((cell) => cell !== "")
              .join(" | ");
            if (TERMINAL.test(phase) || remaining <= 1) {
              // Distinguish "finished, badly" from "we stopped watching", which
              // otherwise both surface as a non-Succeeded phase.
              const timedOut = !TERMINAL.test(phase);
              return cy.wrap({ phase, row: text, timedOut }, { log: false });
            }
            cy.wait(intervalMs);
            return poll(remaining - 1);
          })
      );
    };

    return poll(attempts);
  }
}
