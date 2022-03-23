import React, { useCallback, useEffect } from "react";

import { useFetch } from "@app/shared/hooks";

import { Task, TaskState } from "@app/api/models";
import { getTasks } from "@app/api/rest";
import { StatusIcon } from "@app/shared/components";

export interface ApplicationAnalysisStatusProps {
  id: number;
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
> = ({ id }) => {
  // TODO resolve id
  const fetchTasks = useCallback(() => {
    return getTasks();
  }, [id]);

  const getTaskStatus = (state: TaskState): AnalysisState => {
    if (taskStateToAnalyze.has(state)) {
      const value = taskStateToAnalyze.get(state);
      if (value) return value;
    }
    return "NotStarted";
  };

  const {
    data: tasks,
    fetchError,
    requestFetch: refreshTasks,
  } = useFetch<Array<Task>>({
    defaultIsFetching: true,
    onFetch: fetchTasks,
  });

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  if (fetchError) {
    return <StatusIcon status="NotStarted" />;
  }

  let state: AnalysisState = "NotStarted";
  tasks?.forEach((task) => {
    if (
      task.data &&
      task.state &&
      task.application &&
      task.application.id === id
    )
      state = getTaskStatus(task.state);
  });
  return <StatusIcon status={state} />;
};
