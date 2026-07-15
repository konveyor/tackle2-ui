import axios from "axios";

import { ApplicationImport, ApplicationImportSummary } from "../models";
import { hub } from "../rest";

const APP_IMPORTS = hub`/imports`;
const APP_IMPORTS_SUMMARY = hub`/importsummaries`;
const APP_IMPORTS_SUMMARY_CSV = hub`/importsummaries/download`;
export const APP_IMPORTS_SUMMARY_UPLOAD = hub`/importsummaries/upload`;

export const getApplicationsImportSummary = () =>
  axios
    .get<ApplicationImportSummary[]>(APP_IMPORTS_SUMMARY)
    .then((response) => response.data);

export const getApplicationImportSummaryById = (id: number | string) =>
  axios
    .get<ApplicationImportSummary>(`${APP_IMPORTS_SUMMARY}/${id}`)
    .then((response) => response.data);

export const deleteApplicationImportSummary = (id: number) =>
  axios.delete<void>(`${APP_IMPORTS_SUMMARY}/${id}`);

export const getApplicationImports = (
  importSummaryID: number,
  isValid: boolean | string
) =>
  axios
    .get<
      ApplicationImport[]
    >(`${APP_IMPORTS}?importSummary.id=${importSummaryID}&isValid=${isValid}`)
    .then((response) => response.data);

export const getApplicationSummaryCSV = (id: string) =>
  axios.get<ArrayBuffer>(`${APP_IMPORTS_SUMMARY_CSV}?importSummary.id=${id}`, {
    responseType: "arraybuffer",
    headers: { Accept: "text/csv" },
  });
