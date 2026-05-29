import { MigrationWave } from "../models/migration/migration-waves/migration-wave";

export enum MigrationWaveView {
  generalDatePicker = ".pf-v6-c-date-picker",
  calendarButton = "[aria-label='Toggle date picker']",
  nameInput = "#name",
  startDateInput = "input[aria-label='startDateStr']",
  endDateInput = "input[aria-label='endDateStr']",
  stakeHoldersToggle = "[data-ouia-component-id='stakeholders-toggle']",
  stakeHoldersInput = "#stakeholders-toggle-input",
  stakeHolderGroupsToggle = "[data-ouia-component-id='stakeholder-groups-toggle']",
  stakeHolderGroupsInput = "#stakeholder-groups-toggle-input",
  waveStatusColumn = "td[data-label='Status']",
  yearInput = "input[aria-label='Select year']",
  migrationWavesTable = "table[aria-label='Migration waves table']",
  applicationCountColumn = "td[data-label='Applications']",
  issueManagerSelectToggle = "[data-ouia-component-id='issue-manager-select-toggle']",
  instanceSelectToggle = "[data-ouia-component-id='tracker-select-toggle']",
  projectSelectToggle = "[data-ouia-component-id='project-select-toggle']",
  issueTypeSelectToggle = "[data-ouia-component-id='issue-type-select-toggle']",
  createTrackerButton = "#create-tracker",
  waveExpanded = "pf-m-expanded",
  removeApplicationButton = "button.pf-m-plain",
  unlinkApplicationButton = "button.pf-m-link",
}

export enum MigrationWavesSpecialColumns {
  Applications = "Applications",
  Stakeholders = "Stakeholders",
}
export const getSpecialMigrationWavesTableSelector = (
  wave: MigrationWave,
  columnSelector: MigrationWavesSpecialColumns
) => {
  return `table[aria-label="${columnSelector} table for migration wave ${wave.name}"]`;
};
