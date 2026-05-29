import { useMemo } from "react";

import { Application } from "@app/api/models";
import {
  AnalysisMode,
  isModeSupported,
} from "@app/components/analysis/steps/analysis-source";

const filterAnalyzableApplications = (
  applications: Application[],
  mode: AnalysisMode
) => applications.filter((application) => isModeSupported(application, mode));

export const useAnalyzableApplications = (
  applications: Application[],
  mode: AnalysisMode
) =>
  useMemo(
    () => filterAnalyzableApplications(applications, mode),
    [applications, mode]
  );
