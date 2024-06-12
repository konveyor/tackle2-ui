import { useFetchTaskQueue } from "@app/queries/tasks";
import React, { useContext, useState } from "react";

interface TaskManagerContextProps {
  /** Count of the currently "queued" Tasks */
  queuedCount: number;

  /** Is the task manager drawer currently visible? */
  isExpanded: boolean;

  /** Control if the task manager drawer is visible */
  setIsExpanded: (value: boolean) => void;
}

const TaskManagerContext = React.createContext<TaskManagerContextProps>({
  queuedCount: 0,

  isExpanded: false,
  setIsExpanded: () => undefined,
});

export const useTaskManagerContext = () => {
  const values = useContext(TaskManagerContext);

  return values;
};

export const TaskManagerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { taskQueue } = useFetchTaskQueue();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <TaskManagerContext.Provider
      value={{
        queuedCount: taskQueue.total,
        isExpanded,
        setIsExpanded,
      }}
    >
      {children}
    </TaskManagerContext.Provider>
  );
};
