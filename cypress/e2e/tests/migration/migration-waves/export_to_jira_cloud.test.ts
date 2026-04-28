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
  deleteAllCredentials,
  deleteAllMigrationWaves,
  deleteApplicationTableRows,
  getAuthHeaders,
  login,
} from "../../../../utils/utils";
import { JiraCredentials } from "../../../models/administration/credentials/JiraCredentials";
import { Credentials } from "../../../models/administration/credentials/credentials";
import { Jira } from "../../../models/administration/jira-connection/jira";
import { Application } from "../../../models/migration/applicationinventory/application";
import { MigrationWave } from "../../../models/migration/migration-waves/migration-wave";
import {
  CredentialType,
  JiraIssueTypes,
  JiraType,
} from "../../../types/constants";

import { getWaveIssuesByIssueType, pullJiraIssuesByWaves } from "./common";

const now = new Date();
now.setDate(now.getDate() + 1);

const end = new Date(now.getTime());
end.setFullYear(end.getFullYear() + 1);

let jiraCloudCredentials: JiraCredentials;
let jiraCloudInstance: Jira;
const applications: Application[] = [];
const wavesMap = {};
const appsMap = {};
let projectName = "";

// Automates Polarion TC 340, 359, 360 and 361 for Jira Cloud
/**
 * This test suite contains tests that are co-dependent, so they won't pass if they're executed separately
 * @see export_to_jira_datacenter.test.ts for Jira Datacenter tests
 * This suite is almost identical to jira_datacenter but putting both tests in the same suite would make the code harder to read
 */
describe(
  ["@tier2", "@tier2_secretsNeeded"],
  "Export Migration Wave to Jira Cloud",
  function () {
    before("Create test data", function () {
      if (
        !Cypress.env("jira_atlassian_cloud_project") ||
        !Cypress.env("jira_atlassian_cloud_email") ||
        !Cypress.env("jira_atlassian_cloud_token") ||
        !Cypress.env("jira_atlassian_cloud_url")
      ) {
        expect(
          true,
          `
                    Some configurations required for this test are missing, please ensure that you've properly configured the following parameters in the cypress.config.ts file:\n
                    jira_atlassian_cloud_project\njira_atlassian_cloud_email\njira_atlassian_cloud_token\njira_atlassian_cloud_url
                `
        ).to.eq(false);
      }
      login();
      cy.visit("/");
      deleteAllMigrationWaves();
      deleteApplicationTableRows();
      deleteAllCredentials();

      jiraCloudCredentials = new JiraCredentials(
        data.getJiraCredentialData(CredentialType.jiraBasic, true)
      );
      jiraCloudCredentials.create();

      jiraCloudInstance = new Jira(
        data.getJiraConnectionData(
          jiraCloudCredentials,
          JiraType.cloud,
          false,
          true
        )
      );
      jiraCloudInstance.create();
    });

    Object.values(JiraIssueTypes).forEach((issueType) => {
      it(`Create wave to export as ${issueType}`, function () {
        getAuthHeaders().then((headers) => {
          Application.createMultipleViaApi(
            2,
            undefined,
            undefined,
            undefined,
            headers
          )
            .then((apps) => {
              applications.push(...apps);
              appsMap[issueType] = apps;

              const applicationIds = apps.map((app) => app.id);
              return MigrationWave.createViaApi(
                data.getRandomWord(8),
                now,
                end,
                undefined,
                undefined,
                applicationIds,
                headers
              );
            })
            .then((wave) => {
              wave.applications = appsMap[issueType];
              wavesMap[issueType] = wave;
            });
        });
      });
    });

    Object.values(JiraIssueTypes).forEach((issueType) => {
      it(`Export wave as ${issueType} to Jira`, function () {
        jiraCloudInstance
          .getProject(Cypress.env("jira_atlassian_cloud_project"))
          .then((project) => {
            expect(!!project).to.eq(true);

            if (Array.isArray(project)) {
              project = project[0];
            }

            projectName = project.name;
            expect(Cypress.env("jira_atlassian_cloud_project")).to.eq(
              projectName
            );

            return jiraCloudInstance.getIssueType(issueType);
          })
          .then((issue) => {
            expect(!!issue).to.eq(true);

            wavesMap[issueType].exportToIssueManager(
              JiraType.cloud,
              jiraCloudInstance.name,
              projectName,
              issue.untranslatedName
            );
          });
      });
    });

    it("Assert exports for all issue types", function () {
      pullJiraIssuesByWaves(jiraCloudInstance, projectName, wavesMap).then(
        (issuesByIssueType) => {
          Object.entries(issuesByIssueType).forEach(([issueType, issues]) => {
            expect(
              Cypress._.uniqBy(issues, ({ app }) => app),
              `Issues for ${issueType} are not exported`
            ).to.have.length(2);
          });
        }
      );
    });

    after("Clear test data", function () {
      getWaveIssuesByIssueType({
        jiraInstance: jiraCloudInstance,
        projectName,
        wavesMap,
        usedAppsCount: 2,
      }).then((issuesByIssueType) => {
        jiraCloudInstance.deleteIssues(
          Object.values(issuesByIssueType).flatMap((issues) =>
            issues.map((issue) => issue.issue.id)
          )
        );
      });
      getAuthHeaders().then((headers) => {
        MigrationWave.deleteAllViaApi(headers);
        Application.deleteAllViaApi(headers);
        Credentials.deleteAllViaApi(headers);
      });

      jiraCloudInstance.delete();
      jiraCloudCredentials.delete();
    });
  }
);
