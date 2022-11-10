import * as React from "react";
import { Application } from "@app/api/models";
import { AnalysisMode, ANALYSIS_MODES } from "./schema";

export const isApplicationBinaryEnabled = (
  application: Application
): boolean => {
  if (application.binary !== "::" && application.binary?.match(/.+:.+:.+/))
    return true;
  return false;
};

export const isApplicationSourceCodeEnabled = (
  application: Application
): boolean => {
  if (application.repository && application.repository.url !== "") return true;
  return false;
};

export const isApplicationSourceCodeDepsEnabled = (
  application: Application
): boolean => {
  if (application.repository && application.repository.url !== "") return true;
  return false;
};

export const isModeSupported = (application: Application, mode: string) => {
  if (mode === "binary-upload") return true;
  if (mode === "binary") return isApplicationBinaryEnabled(application);
  else if (mode === "source-code-deps")
    return isApplicationSourceCodeDepsEnabled(application);
  else return isApplicationSourceCodeEnabled(application);
};

const filterAnalyzableApplications = (
  applications: Application[],
  mode: AnalysisMode
) => applications.filter((application) => isModeSupported(application, mode));

export const useAnalyzableApplications = (
  applications: Application[],
  mode: AnalysisMode
) =>
  React.useMemo(
    () => filterAnalyzableApplications(applications, mode),
    [applications, mode]
  );

export const useAnalyzableApplicationsByMode = (
  applications: Application[]
): Record<AnalysisMode, Application[]> =>
  React.useMemo(
    () =>
      ANALYSIS_MODES.reduce(
        (record, mode) => ({
          ...record,
          [mode]: filterAnalyzableApplications(applications, mode),
        }),
        {} as Record<AnalysisMode, Application[]>
      ),
    [applications]
  );
