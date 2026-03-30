export const instanceName = "#name";
export const instanceUrl = "#url";
export const selectTypeToggle =
  "button[aria-label='Type select dropdown toggle']";
export const selectCredentialToggle =
  "button[aria-label='Credentials select dropdown toggle']";
export const createJiraButton = "#create-Tracker";
export const jiraTable = "table[aria-label='Jira trackers table']";
export const jiraAlert = "h4.pf-v6-c-alert__title";
export enum jiraLabels {
  name = 'td[data-label="Instance name"]',
  url = 'td[data-label="URL"]',
  type = 'td[data-label="Instance type"]',
  connection = 'td[data-label="Connection"]',
}
