import React, { useCallback, useEffect } from "react";

import { useFetch } from "@app/shared/hooks";

import { Task, TaskStatus } from "@app/api/models";
import { getTasks } from "@app/api/rest";
import { StatusIconAssessment } from "@app/shared/components";

export interface ApplicationAnalysisStatusProps {
  id: number;
}

const taskToUI: Map<string, TaskStatus> = new Map([
  ["No task", "NotStarted"],
  ["Ready", "Scheduled"],
  ["Created", "Scheduled"],
  ["Running", "InProgress"],
  ["not supported", "Canceled"],
  ["Failed", "Failed"],
  ["Succeeded", "Completed"],
]);

export const ApplicationAnalysisStatus: React.FC<
  ApplicationAnalysisStatusProps
> = ({ id }) => {
  // TODO resolve id
  const fetchTasks = useCallback(() => {
    return getTasks();
  }, [id]);

  const getTaskStatus = (status: string): TaskStatus => {
    if (taskToUI.has(status)) {
      const value = taskToUI.get(status);
      if (value) return value;
    }
    return "Unknown";
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
    return <StatusIconAssessment status="NotStarted" />;
  }

  let state: TaskStatus = "NotStarted";
  tasks?.forEach((task) => {
    if (
      task.data &&
      task.state &&
      task.application &&
      task.application.id === id
    )
      state = getTaskStatus(task.state);
  });
  return <StatusIconAssessment status={state} />;
};
