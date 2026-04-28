import { Jira } from "../../../models/administration/jira-connection/jira";
import { JiraIssue } from "../../../models/administration/jira-connection/jira-api.interface";
import { MigrationWave } from "../../../models/migration/migration-waves/migration-wave";
import { SEC } from "../../../types/constants";

export const getWaveIssuesByIssueType = ({
  jiraInstance,
  projectName,
  wavesMap,
  usedAppsCount,
}: {
  jiraInstance: Jira;
  projectName: string;
  wavesMap: Record<string, MigrationWave>;
  usedAppsCount: number;
}): Cypress.Chainable<{
  [k: string]: IssueWithApp[];
}> =>
  jiraInstance.getIssues(projectName).then((issues: JiraIssue[]) =>
    issues.reduce(
      (acc, issue) => {
        const jiraType = issue.fields.issuetype.name;
        const waveType = Object.keys(wavesMap).find(
          (type) => type.toUpperCase() === jiraType.toUpperCase()
        );

        if (!acc[waveType]) {
          return acc;
        }

        const apps: string[] = wavesMap[waveType].applications
          .map((app) => app.name)
          .slice(0, usedAppsCount);

        const appForIssue = apps.find((appName) =>
          issue.fields.summary.includes(appName)
        );
        if (appForIssue) {
          acc[waveType].push({ issue, app: appForIssue });
        }
        return acc;
      },
      Object.fromEntries(
        Object.keys(wavesMap).map((issueType): [string, IssueWithApp[]] => [
          issueType,
          [],
        ])
      )
    )
  );

export type IssueWithApp = {
  issue: JiraIssue;
  app: string;
};

/**
 * Retry pulling Jira issues for waves until the expected number of issues is reached.
 * @returns aggregated issues by issue type if success, otherwise throws an error.
 */
export const pullJiraIssuesByWaves = (
  jiraInstance: Jira,
  projectName: string,
  wavesMap: Record<string, MigrationWave>,
  expectedIssuesCountPerType: number = 2,
  maxAttempts: number = 10,
  waitTimeInSeconds: number = 10
): Cypress.Chainable<{
  [k: string]: IssueWithApp[];
}> => {
  function recursivePull(attemptNumber: number): Cypress.Chainable<{
    [k: string]: IssueWithApp[];
  }> {
    if (attemptNumber > maxAttempts) {
      throw new Error(`Max attempts reached: ${maxAttempts}`);
    }
    cy.log(`Next pull in ${waitTimeInSeconds} seconds...`);
    cy.wait(waitTimeInSeconds * SEC);
    return getWaveIssuesByIssueType({
      jiraInstance,
      projectName,
      wavesMap,
      usedAppsCount: expectedIssuesCountPerType,
    }).then((issuesByIssueType: Record<string, IssueWithApp[]>) => {
      const success = Object.values(issuesByIssueType).every(
        (issues) => issues.length === expectedIssuesCountPerType
      );

      if (success) {
        cy.log(
          `All data for ${Object.keys(issuesByIssueType).length} issue types ready after ${attemptNumber} attempts. `
        );
        return cy.wrap(issuesByIssueType);
      }
      return recursivePull(attemptNumber + 1);
    });
  }

  return recursivePull(0);
};
