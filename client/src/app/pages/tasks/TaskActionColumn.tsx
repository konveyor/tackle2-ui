import React, { FC } from "react";

import { Task } from "@app/api/models";
import { ActionsColumn } from "@patternfly/react-table";
import { useTaskActions } from "./useTaskActions";

export const TaskActionColumn: FC<{ task: Task }> = ({ task }) => {
  const actions = useTaskActions(task);
  return <ActionsColumn items={actions} />;
};
