import { type FC } from "react";
import { ActionsColumn } from "@patternfly/react-table";

import { Task } from "@app/api/models";

import { useTaskActions } from "./useTaskActions";

export const TaskActionColumn: FC<{ task: Task<unknown> }> = ({ task }) => {
  const actions = useTaskActions(task);
  return <ActionsColumn items={actions} />;
};
