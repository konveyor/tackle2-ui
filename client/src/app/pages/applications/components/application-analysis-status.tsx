import React from "react";

import { TaskState } from "@app/api/models";
import { IconedStatus } from "@app/components/Icons";

export interface ApplicationAnalysisStatusProps {
  state: TaskState;
}

export type AnalysisState =
  | "Canceled"
  | "Scheduled"
  | "Completed"
  | "Failed"
  | "InProgress"
  | "NotStarted";

const taskStateToAnalyze: Map<TaskState, AnalysisState> = new Map([
  ["not supported", "Canceled"],
  ["Canceled", "Canceled"],
  ["Created", "Scheduled"],
  ["Succeeded", "Completed"],
  ["Failed", "Failed"],
  ["Running", "InProgress"],
  ["No task", "NotStarted"],
  ["Pending", "Scheduled"],
  ["Postponed", "Scheduled"],
  ["Ready", "Scheduled"],
]);

export const ApplicationAnalysisStatus: React.FC<
  ApplicationAnalysisStatusProps
> = ({ state }) => {
  const getTaskStatus = (state: TaskState): AnalysisState => {
    if (taskStateToAnalyze.has(state)) {
      const value = taskStateToAnalyze.get(state);
      if (value) return value;
    }
    return "NotStarted";
  };

  return <IconedStatus preset={getTaskStatus(state)} />;
};
