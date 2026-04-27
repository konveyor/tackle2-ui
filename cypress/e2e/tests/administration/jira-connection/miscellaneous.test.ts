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

import {
  getJiraConnectionData,
  getJiraCredentialData,
} from "../../../../utils/data_utils";
import {
  clickByText,
  deleteAllCredentials,
  deleteAllJiraConnections,
  deleteApplicationTableRows,
  login,
} from "../../../../utils/utils";
import { JiraCredentials } from "../../../models/administration/credentials/JiraCredentials";
import { Jira } from "../../../models/administration/jira-connection/jira";
import { CredentialType, JiraType, button } from "../../../types/constants";
import { JiraConnectionData } from "../../../types/types";

describe(
  ["@tier3", "@tier3_secretsNeeded"],
  "Jira connection negative tests",
  () => {
    const expectedToFail = true;
    const useTestingAccount = true;
    const isSecure = false;
    let jiraBasicCredential: JiraCredentials;
    let jiraBasicCredentialInvalid: JiraCredentials;
    let jiraBearerCredentialInvalid: JiraCredentials;
    let jiraStageConnectionDataIncorrect: JiraConnectionData;
    let jiraCloudConnectionDataIncorrect: JiraConnectionData;
    let jiraCloudConnectionIncorrect: Jira;
    let jiraStageConnectionIncorrect: Jira;

    before("Login and create required credentials", function () {
      login();
      cy.visit("/");
      jiraBasicCredential = new JiraCredentials(
        getJiraCredentialData(CredentialType.jiraBasic, useTestingAccount)
      );
      jiraBasicCredential.create();

      // Defining and creating dummy credentials to be used further in tests
      jiraBasicCredentialInvalid = new JiraCredentials(
        getJiraCredentialData(CredentialType.jiraBasic, !useTestingAccount)
      );
      jiraBasicCredentialInvalid.create();

      jiraBearerCredentialInvalid = new JiraCredentials(
        getJiraCredentialData(CredentialType.jiraToken, !useTestingAccount)
      );
      jiraBearerCredentialInvalid.create();

      // Defining Jira Cloud connection data with incorrect credentials
      jiraCloudConnectionDataIncorrect = getJiraConnectionData(
        jiraBasicCredentialInvalid,
        JiraType.cloud,
        isSecure,
        useTestingAccount
      );
      jiraCloudConnectionIncorrect = new Jira(jiraCloudConnectionDataIncorrect);

      // Defining Jira Stage connection data with incorrect credentials
      jiraStageConnectionDataIncorrect = getJiraConnectionData(
        jiraBearerCredentialInvalid,
        JiraType.server,
        isSecure,
        useTestingAccount
      );
      jiraStageConnectionIncorrect = new Jira(jiraStageConnectionDataIncorrect);
    });

    const validateCodeContent = (connection: Jira) => {
      /**
         Implements MTA-362 - Add JIRA instance with invalid credentials
         Automates https://issues.redhat.com/browse/MTA-991
         */
      connection.create();
      connection.validateState(expectedToFail);

      // scope to the right table row
      cy.get(`[data-item-name="${connection.name}"]`)
        .first()
        .within(() => {
          clickByText(button, "Not connected");
        });

      cy.get("#code-content")
        // wait for message - initial message is empty
        .contains(/\w+/)
        .then(($code) => {
          expect($code.text().toLowerCase()).not.to.contain("html");
        });
    };

    it("Validating error when Jira Cloud Instance is not connected", () => {
      validateCodeContent(jiraCloudConnectionIncorrect);
    });

    it("Validating error when Jira Stage Instance is not connected", () => {
      validateCodeContent(jiraStageConnectionIncorrect);
    });

    after("Clean up data", () => {
      deleteAllJiraConnections();
      deleteAllCredentials();
      deleteApplicationTableRows();
    });
  }
);
