import React from "react";

import { StatusIcon } from "@app/shared/components";
import { useFetchTasks } from "@app/queries/tasks";
import { TaskState } from "@app/api/models";

export interface ApplicationAnalysisStatusProps {
  applicationID: number;
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
  ["Created", "Scheduled"],
  ["Succeeded", "Completed"],
  ["Failed", "Failed"],
  ["Running", "InProgress"],
  ["No task", "NotStarted"],
  ["Ready", "Scheduled"],
]);

export const ApplicationAnalysisStatus: React.FC<
  ApplicationAnalysisStatusProps
> = ({ applicationID }) => {
  const { tasks, fetchError } = useFetchTasks();

  const getTaskStatus = (state: TaskState): AnalysisState => {
    if (taskStateToAnalyze.has(state)) {
      const value = taskStateToAnalyze.get(state);
      if (value) return value;
    }
    return "NotStarted";
  };

  if (fetchError) {
    return <StatusIcon status="NotStarted" />;
  }

  let state: AnalysisState = "NotStarted";
  tasks?.forEach((task) => {
    if (
      task.data &&
      task.state &&
      task.application &&
      task.application.id === applicationID
    )
      state = getTaskStatus(task.state);
  });
  return <StatusIcon status={state} />;
};
