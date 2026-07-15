import axios from "axios";

import { ApplicationImport, ApplicationImportSummary } from "../models";
import { hub } from "../rest";

const APP_IMPORTS = hub`/imports`;
const APP_IMPORTS_SUMMARY = hub`/importsummaries`;
const APP_IMPORTS_SUMMARY_CSV = hub`/importsummaries/download`;
export const APP_IMPORTS_SUMMARY_UPLOAD = hub`/importsummaries/upload`;

export const getApplicationsImportSummary = (): Promise<
  ApplicationImportSummary[]
> => axios.get(APP_IMPORTS_SUMMARY).then((response) => response.data);

export const getApplicationImportSummaryById = (
  id: number | string
): Promise<ApplicationImportSummary> =>
  axios.get(`${APP_IMPORTS_SUMMARY}/${id}`).then((response) => response.data);

export const deleteApplicationImportSummary = (
  id: number
): Promise<ApplicationImportSummary> =>
  axios.delete(`${APP_IMPORTS_SUMMARY}/${id}`);

export const getApplicationImports = (
  importSummaryID: number,
  isValid: boolean | string
): Promise<ApplicationImport[]> =>
  axios
    .get(
      `${APP_IMPORTS}?importSummary.id=${importSummaryID}&isValid=${isValid}`
    )
    .then((response) => response.data);

export const getApplicationSummaryCSV = (id: string) => {
  return axios.get<ArrayBuffer>(
    `${APP_IMPORTS_SUMMARY_CSV}?importSummary.id=${id}`,
    {
      responseType: "arraybuffer",
      headers: { Accept: "text/csv" },
    }
  );
};
