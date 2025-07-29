import React from "react";

import { TaskState } from "@app/api/models";
import {
  buildPresetLabels,
  IconedStatus,
  IconedStatusPreset,
} from "@app/components/Icons";

export interface ColumnAnalysisStatusProps {
  state: TaskState;
}

export const taskStateToAnalyze: Map<TaskState, IconedStatusPreset> = new Map([
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

export const ColumnAnalysisStatus: React.FC<ColumnAnalysisStatusProps> = ({
  state,
}) => {
  return <IconedStatus preset={getTaskStatus(state)} />;
};

export const mapAnalysisStateToLabel = (
  state: TaskState,
  t: (key: string) => string
) => {
  const presetKey: IconedStatusPreset = getTaskStatus(state);
  const presets = buildPresetLabels(t);
  const label = presets[presetKey]?.label ?? presets.Unknown.label;
  return label;
};
