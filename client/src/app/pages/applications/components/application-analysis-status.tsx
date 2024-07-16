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
