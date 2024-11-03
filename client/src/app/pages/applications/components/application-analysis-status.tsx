import React from "react";

import { TaskState } from "@app/api/models";
import { IconedStatus, IconedStatusPreset } from "@app/components/Icons";
import { useTranslation } from "react-i18next";
export interface ApplicationAnalysisStatusProps {
  state: TaskState;
}

const taskStateToAnalyze: Map<TaskState, IconedStatusPreset> = new Map([
  ["not supported", "Canceled"],
  ["Canceled", "Canceled"],
  ["Created", "Scheduled"],
  ["Succeeded", "Completed"],
  ["SucceededWithErrors", "CompletedWithErrors"],
  ["Failed", "Failed"],
  ["Running", "InProgress"],
  ["No task", "NotStarted"],
  ["Pending", "Scheduled"],
  ["Postponed", "Scheduled"],
  ["Ready", "Scheduled"],
]);

const getTaskStatus = (state: TaskState): IconedStatusPreset => {
  if (taskStateToAnalyze.has(state)) {
    const value = taskStateToAnalyze.get(state);
    if (value) return value;
  }
  return "NotStarted";
};

export const ApplicationAnalysisStatus: React.FC<
  ApplicationAnalysisStatusProps
> = ({ state }) => {
  return <IconedStatus preset={getTaskStatus(state)} />;
};
export const mapAnalysisStateToLabel = (value: TaskState) => {
  const presetKey: IconedStatusPreset = getTaskStatus(value);
  const { t } = useTranslation();
  const presets = buildPresets(t);
  const label = presets[presetKey]?.label ?? t("terms.unknown");
  return label;
};
export const buildPresets = (
  t: (key: string) => string
): Record<IconedStatusPreset, { label: string }> => ({
  Canceled: { label: t("terms.canceled") },
  Scheduled: { label: t("terms.scheduled") },
  Completed: { label: t("terms.completed") },
  CompletedWithErrors: { label: t("terms.completedWithErrors") },
  Failed: { label: t("terms.failed") },
  InProgress: { label: t("terms.inProgress") },
  NotStarted: { label: t("terms.notStarted") },
  InheritedReviews: { label: t("terms.inheritedReviews") },
  InProgressInheritedReviews: { label: t("terms.inProgressInheritedReviews") },
  InProgressInheritedAssessments: {
    label: t("terms.inProgressInheritedAssessments"),
  },
  InheritedAssessments: { label: t("terms.inheritedAssessments") },
  Error: { label: t("terms.error") }, // Add Error with a label
  Ok: { label: t("terms.ok") }, // Add Ok with a label
  Unknown: { label: t("terms.unknown") }, // Add Unknown with a label
});
