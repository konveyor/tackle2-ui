import React, { createContext, useContext, useState } from "react";
import { Taskgroup } from "@app/api/models";

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

export const TaskGroupProvider: React.FC<TaskGroupProvider> = ({
  children,
}) => {
  const [taskGroup, setTaskGroup] = useState<Taskgroup | null>(null);

  const updateTaskGroup = (taskGroup: Taskgroup | null) => {
    setTaskGroup(taskGroup);
  };

  return (
    <TaskGroupContext.Provider value={{ taskGroup, updateTaskGroup }}>
      {children}
    </TaskGroupContext.Provider>
  );
};
