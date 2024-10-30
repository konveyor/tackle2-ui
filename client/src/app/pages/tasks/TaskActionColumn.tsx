import React, { FC } from "react";

import { Task } from "@app/api/models";
import { ActionsColumn } from "@patternfly/react-table";
import { useTaskActions } from "./useTaskActions";

export const TaskActionColumn: FC<{ task: Task; isFApplication: boolean }> = ({
  task,
  isFApplication,
}) => {
  const actions = useTaskActions(task, isFApplication);
  return <ActionsColumn items={actions} />;
};
