import * as React from "react";
import { Application, Target, TargetLabel } from "@app/api/models";
import { AnalysisMode, ANALYSIS_MODES } from "./schema";
import { toggle, unique } from "radash";
import { getParsedLabel } from "@app/utils/rules-utils";

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

/**
 * Toggle the existence of a target within the array and return the array
 */
export const toggleSelectedTargets = (
  target: Target,
  selectedTargets: Target[]
): Target[] => {
  return toggle(selectedTargets, target, (t) => t.id);
};

export const updateSelectedTargetLabels = (
  isSelecting: boolean,
  selectedLabelName: string,
  target: Target,
  currentSelectedTargetLabels: TargetLabel[]
) => {
  const testLabelNames = target.custom
    ? (target.labels?.map((label) => label.name) ?? [])
    : [selectedLabelName];

  const otherSelectedLabels = currentSelectedTargetLabels.filter(
    (label) => !testLabelNames.includes(label.name)
  );

  if (!isSelecting) {
    return otherSelectedLabels;
  }

  const matchingTargetLabels = target.custom
    ? target.labels
    : target.labels?.filter((l) => l.name === selectedLabelName);

  return matchingTargetLabels
    ? [...otherSelectedLabels, ...matchingTargetLabels]
    : otherSelectedLabels;
};

/**
 * Match a target to a set of target type labels based on if the target supports
 * label choice.
 */
const matchTargetToLabels = (target: Target, labels: TargetLabel[]) => {
  if (!target.labels?.length) {
    return false;
  }

  const targetTargetLabelCount = target.labels?.reduce(
    (count, tl) =>
      getParsedLabel(tl.label).labelType === "target" ? count + 1 : count,
    0
  );

  const matches = labels
    .map((l) => target.labels?.find((tl) => tl.label === l.label) ?? false)
    .filter(Boolean).length;

  return target.choice ? matches >= 1 : matches === targetTargetLabelCount;
};

/**
 * Given a set of selected labels, return a set of targets where (1) the target's labels
 * properly match the select labels or (2) the target is selected but has no labels.
 */
export const updateSelectedTargetsBasedOnLabels = (
  currentFormLabels: TargetLabel[],
  selectedTargets: Target[],
  targets: Target[]
): Target[] => {
  const targetsFromLabels = unique(
    targets.filter((target) => matchTargetToLabels(target, currentFormLabels)),
    (target) => target.id
  );

  const selectedTargetsWithNoLabel = selectedTargets.filter(
    (target) => (target.labels?.length ?? 0) === 0
  );

  return [...targetsFromLabels, ...selectedTargetsWithNoLabel];
};
