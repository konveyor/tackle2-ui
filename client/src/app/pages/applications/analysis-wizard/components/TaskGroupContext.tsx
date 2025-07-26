import React, { createContext, useContext, useState } from "react";

import { Taskgroup } from "@app/api/models";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { useCreateTaskgroupMutation } from "@app/queries/taskgroups";
import { defaultTaskgroup } from "../analysis-wizard";

interface TaskGroupContext {
  createTaskGroup: () => Promise<Taskgroup>;
  updateTaskGroup: (taskGroup: Taskgroup | null) => void;
  taskGroup: Taskgroup | null;
}

const TaskGroupContext = createContext<TaskGroupContext>({
  createTaskGroup: () => Promise.resolve({ ...defaultTaskgroup, id: -1 }),
  updateTaskGroup: () => {},
  taskGroup: null,
});

export const useTaskGroup = () => useContext(TaskGroupContext);

interface TaskGroupProvider {
  children: React.ReactNode;
}

export const TaskGroupProvider: React.FunctionComponent<TaskGroupProvider> = ({
  children,
}) => {
  const { pushNotification } = React.useContext(NotificationsContext);

  const [taskGroup, setTaskGroup] = useState<Taskgroup | null>(null);

  const updateTaskGroup = (newTaskGroup: Taskgroup | null) => {
    setTaskGroup(newTaskGroup);
  };

  const { mutateAsync } = useCreateTaskgroupMutation(
    (data: Taskgroup) => {
      updateTaskGroup(data);
    },
    (error: Error | unknown) => {
      console.log("Taskgroup creation failed: ", error);
      pushNotification({
        title: "Taskgroup creation failed",
        variant: "danger",
      });
    }
  );

  const createTaskGroup = async () => {
    if (!taskGroup) {
      const newTaskGroup = await mutateAsync(defaultTaskgroup);
      return newTaskGroup;
    }
    return taskGroup;
  };

  return (
    <TaskGroupContext.Provider
      value={{ taskGroup, updateTaskGroup, createTaskGroup }}
    >
      {children}
    </TaskGroupContext.Provider>
  );
};
