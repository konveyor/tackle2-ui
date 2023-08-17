import { Taskgroup } from "@app/api/models";
import React, { createContext, useContext, useState } from "react";

interface TaskGroupContext {
  updateTaskGroup: (taskGroup: Taskgroup | null) => void;
  taskGroup: Taskgroup | null;
}

const TaskGroupContext = createContext<TaskGroupContext>({
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
  const [taskGroup, setTaskGroup] = useState<Taskgroup | null>(null);

  const updateTaskGroup = (newTaskGroup: Taskgroup | null) => {
    setTaskGroup(newTaskGroup);
  };

  return (
    <TaskGroupContext.Provider value={{ taskGroup, updateTaskGroup }}>
      {children}
    </TaskGroupContext.Provider>
  );
};
