import React, { FC } from "react";

import { Task } from "@app/api/models";
import { ActionsColumn } from "@patternfly/react-table";
import { useTaskActions } from "./useTaskActions";
//path
export interface TaskActionColumnProps {
  task: Task;
  isFApplication: boolean;
}

export const TaskActionColumn: FC<TaskActionColumnProps> = ({
  task,
  isFApplication,
}) => {
  const actions = useTaskActions(task, isFApplication);
  return <ActionsColumn items={actions} />;
};
