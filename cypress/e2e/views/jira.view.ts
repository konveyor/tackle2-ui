export const instanceName = "#name";
export const instanceUrl = "#url";
export const selectTypeToggle =
  '[data-ouia-component-id="type-select-toggle"] [data-ouia-component-type="PF5/TextInput"]';
export const selectCredentialToggle =
  '[data-ouia-component-id="credentials-select-toggle"] [data-ouia-component-type="PF5/TextInput"]';
export const createJiraButton = "#create-Tracker";
export const jiraTable = "table[aria-label='Jira trackers table']";
export const jiraAlert = "h4.pf-c-alert__title";
export enum jiraLabels {
  name = 'td[data-label="Instance name"]',
  url = 'td[data-label="URL"]',
  type = 'td[data-label="Instance type"]',
  connection = 'td[data-label="Connection"]',
}
