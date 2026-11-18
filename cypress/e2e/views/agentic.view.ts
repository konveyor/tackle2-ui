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
export const agentRunsPath = "/agent-runs";
export const createRunButton = "Create run";

export const createRunForm = "#create-run-form";
export const createRunAgent = "#create-agent";
export const createRunApplication = "#create-application";
export const createRunTargetBranch = "#create-run-target-branch";
export const createRunInstructions = "#create-instructions";
export const createRunSubmit = "#create-run-submit";
export const createRunCancel = "#create-run-cancel";

/**
 * The Gateway field only renders when the Agent does not resolve to exactly
 * one gateway - see GatewayPicker and agentic-controller#215. Its absence for
 * an Agent that declares none is the bug tackle2-ui#3605 fixed, so tests check
 * whether it exists rather than assuming it.
 */
export const createRunGateway = "#create-gateway";

/**
 * Cells in the runs table, addressed by the dataLabel the table controls set
 * from the column name. Matching a phase against the whole row would let the
 * run name, the application or the reason satisfy it.
 */
export const runRowPhase = '[data-label="Phase"]';

/** Run detail path is /agent-runs/<name>, which is how a new name is read. */
export const runNameFromPath = /\/agent-runs\/([^/?#]+)$/;
