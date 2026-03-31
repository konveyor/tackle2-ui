/* eslint-disable @typescript-eslint/no-require-imports */
/*
 * Copyright © 2021 the Konveyor Contributors (https://konveyor.io/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// commands from libraries
import "cypress-mochawesome-reporter/register";
import "cypress-downloadfile/lib/downloadFileCommand";
import "cypress-fail-fast";
import "cypress-file-upload";
import "cypress-fs";
import "cypress-react-selector";
import "cypress-real-events";
require("cy-verify-downloads").addCustomCommand();

// plugins
import "cypress-log-filter";

// custom commands
import "./commands";

import { login } from "../utils/utils";

/** Hide XHR logs line */
// TODO: Improve by implementing a configuration parameter
const app = window.top;

if (
  app &&
  !app.document.head.querySelector("[data-hide-command-log-request]")
) {
  const style = app.document.createElement("style");
  style.innerHTML =
    ".command-name-request, .command-name-xhr { display: none }";
  style.setAttribute("data-hide-command-log-request", "");

  app.document.head.appendChild(style);
}

Cypress.on("uncaught:exception", (err) => {
  if (err.message.includes("Failed to execute 'importScripts'")) {
    return false; // don't fail test
  }
  if (err.message.includes("clipboard-write")) {
    return false; // don't fail test - clipboard API not supported in headless browser
  }
  // Only suppress generic null/undefined errors if they're from Keycloak admin console
  if (
    (err.message.includes("Cannot read properties of null") ||
      err.message.includes("can't access property")) &&
    (window.location.href.includes("/auth/") || err.stack?.includes("keycloak"))
  ) {
    return false; // don't fail test - Keycloak admin UI bug
  }
});

// ── Command-level tracing ────────────────────────────────────────────
// Enabled with:  --env TRACE_COMMANDS=true
// Logs every Cypress command with its duration (ms) to the terminal.
if (Cypress.env("TRACE_COMMANDS")) {
  const cmdStack: Array<{ name: string; args: string; start: number }> = [];

  Cypress.on("command:start", (cmd) => {
    const args = (cmd.get("args") || [])
      .map((a: unknown) => (typeof a === "string" ? a : ""))
      .filter(Boolean)
      .join(", ");
    cmdStack.push({
      name: cmd.get("name"),
      args,
      start: performance.now(),
    });
  });

  Cypress.on("command:end", (_cmd) => {
    const entry = cmdStack.pop();
    if (!entry) return;
    // Skip task commands to prevent recursive tracing (cy.task fires command:end)
    if (entry.name === "task") return;
    const duration = Math.round(performance.now() - entry.start);
    const label = entry.args ? `${entry.name}(${entry.args})` : entry.name;
    // Only log commands that took > 50ms to reduce noise
    if (duration > 50) {
      cy.task("log", `⏱  ${duration}ms  ${label}`, { log: false });
    }
  });
}

beforeEach(() => {
  // Disable for static report tests as they need to open local files
  if (Cypress.config("baseUrl") === null) {
    return;
  }

  login();

  // Every test starts by visiting / which should redirect to baseURL/applications
  cy.visit("/");
});
