import React from "react";

import { TaskState } from "@app/api/models";
import { IconedStatus, IconedStatusPreset } from "@app/components/Icons";
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

export const mapAnalysisStateToLabel = (
  value: TaskState,
  t: (key: string) => string
) => {
  const presetKey: IconedStatusPreset = getTaskStatus(value);
  const presets = buildPresets(t);
  const label = presets[presetKey]?.label ?? t("terms.unknown");
  return label;
};

export const buildPresets = (
  t: (key: string) => string
): Record<IconedStatusPreset, { label: string }> => ({
  InProgressInheritedReviews: { label: t("terms.inProgress") },
  InProgressInheritedAssessments: { label: t("terms.inProgress") },
  InheritedReviews: { label: t("terms.completed") },
  InheritedAssessments: { label: t("terms.completed") },
  Canceled: { label: t("terms.canceled") },
  Completed: { label: t("terms.completed") },
  CompletedWithErrors: { label: t("terms.completedWithErrors") },
  Error: { label: t("terms.error") },
  Failed: { label: t("terms.failed") },
  InProgress: { label: t("terms.inProgress") },
  NotStarted: { label: t("terms.notStarted") },
  Scheduled: { label: t("terms.scheduled") },
  Ok: { label: t("terms.ok") }, // Add Ok with a label
  Unknown: { label: t("terms.unknown") }, // Add Unknown with a label
});
