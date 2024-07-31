import * as React from "react";
import { Application, Target, TargetLabel } from "@app/api/models";
import { AnalysisMode, ANALYSIS_MODES } from "./schema";
import { toggle } from "radash";

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

export const getUpdatedFormLabels = (
  isSelecting: boolean,
  selectedLabelName: string,
  target: Target,
  formLabels: TargetLabel[]
) => {
  if (target.custom) {
    const customTargetLabelNames = target.labels?.map((label) => label.name);
    const otherSelectedLabels = formLabels?.filter(
      (formLabel) => !customTargetLabelNames?.includes(formLabel.name)
    );
    return isSelecting && target.labels
      ? [...otherSelectedLabels, ...target.labels]
      : otherSelectedLabels;
  } else {
    const otherSelectedLabels = formLabels?.filter(
      (formLabel) => formLabel.name !== selectedLabelName
    );
    if (isSelecting) {
      const matchingLabel = target.labels?.find(
        (label) => label.name === selectedLabelName
      );
      return matchingLabel
        ? [...otherSelectedLabels, matchingLabel]
        : otherSelectedLabels;
    }
    return otherSelectedLabels;
  }
};
export const findLabelBySelector = (labels: TargetLabel[], selector: string) =>
  labels.find((label) => label.label === selector) || "";

export const isLabelInFormLabels = (formLabels: TargetLabel[], label: string) =>
  formLabels.some((formLabel) => formLabel.label === label);

export const labelToTarget = (labelName: string, targets: Target[]) => {
  const target = targets.find(
    (t) => t.labels?.some((l) => l.name === labelName)
  );
  return target ? target : null;
};

export const updateSelectedTargetsBasedOnLabels = (
  currentFormLabels: TargetLabel[],
  selectedTargets: Target[],
  targets: Target[]
): Target[] => {
  const targetsFromLabels = currentFormLabels
    .map((label) => labelToTarget(label.name, targets))
    .filter(Boolean);

  const newSelectedTargets = currentFormLabels.reduce(
    (acc: Target[], formLabel) => {
      const target = labelToTarget(formLabel.name, targets);
      if (target && !acc.some((v) => v.id === target.id)) {
        acc.push(target);
      }
      return acc;
    },
    []
  );

  // TODO: If a Target doesn't have a label (i.e. is a custom repo), it should
  //       stick around and not get dropped here
  const filteredSelectedTargets = selectedTargets.filter((target) =>
    targetsFromLabels.some((current) => current?.id === target.id)
  );

  return [...new Set([...newSelectedTargets, ...filteredSelectedTargets])];
};
