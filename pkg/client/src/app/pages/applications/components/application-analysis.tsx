import React, { useCallback, useEffect } from "react";

import { useFetch } from "@app/shared/hooks";

import { Task, TaskStatus } from "@app/api/models";
import { getTasks } from "@app/api/rest";
import { StatusIconAssessment } from "@app/shared/components";
import { TypeOf } from "yup";

export interface ApplicationAnalysisStatusProps {
  id: number;
}

export const ApplicationAnalysisStatus: React.FC<
  ApplicationAnalysisStatusProps
> = ({ id }) => {
  const fetchTasks = useCallback(() => {
    return getTasks();
  }, [id]);

  const {
    data: tasks,
    fetchError,
    requestFetch: refreshBusinessService,
  } = useFetch<Array<Task>>({
    defaultIsFetching: true,
    onFetch: fetchTasks,
  });

  useEffect(() => {
    refreshBusinessService();
  }, [refreshBusinessService]);

  if (fetchError) {
    return <StatusIconAssessment status="NotStarted" />;
  }

  let status: TaskStatus = "NotStarted";
  tasks?.forEach((task) => {
    if (task.data && task.data.application === id) status = task.status;
  });
  console.log(status);
  return <StatusIconAssessment status={status} />;
};
