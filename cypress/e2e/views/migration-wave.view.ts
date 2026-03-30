import { MigrationWave } from "../models/migration/migration-waves/migration-wave";

export enum MigrationWaveView {
  generalDatePicker = ".pf-v6-c-date-picker",
  calendarButton = "[aria-label='Toggle date picker']",
  submitButton = "#migration-wave-form-submit",
  nameInput = "#name",
  startDateInput = "input[aria-label='startDateStr']",
  endDateInput = "input[aria-label='endDateStr']",
  stakeHoldersInput = "button[aria-label='Stakeholders select dropdown toggle']",
  stakeHolderGroupsInput = "button[aria-label='Stakeholder groups select dropdown toggle']",
  waveStatusColumn = "td[data-label='Status']",
  yearInput = "input[aria-label='Select year']",
  migrationWavesTable = "table[aria-label='Migration waves table']",
  applicationCountColumn = "td[data-label='Applications']",
  issueManagerSelectToggle = "button[aria-label='Type select dropdown toggle']",
  instanceSelectToggle = "button[aria-label='tracker select dropdown toggle']",
  projectSelectToggle = "button[aria-label='project select dropdown toggle']",
  issueTypeSelectToggle = "button[aria-label='issue-type select dropdown toggle']",
  createTrackerButton = "#create-tracker",
  waveExpanded = "pf-m-expanded",
  removeApplicationButton = ".pf-v6-u-text-align-right > button.pf-m-plain",
  unlinkApplicationButton = ".pf-v6-u-text-align-right button.pf-m-link",
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
