import { useContext, useState } from "react";

import { New, Taskgroup } from "@app/api/models";
import { NotificationsContext } from "@app/components/NotificationsContext";
import {
  useCreateTaskgroupMutation,
  useDeleteTaskgroupMutation,
  useSubmitTaskgroupMutation,
} from "@app/queries/taskgroups";

import { defaultTaskgroup } from "./analysis-wizard";

export const useTaskGroupManager = () => {
  const { pushNotification } = useContext(NotificationsContext);
  const [taskGroup, setTaskGroup] = useState<Taskgroup | null>(null);

  // Create taskgroup mutation
  const { mutateAsync: createTaskgroupAsync } = useCreateTaskgroupMutation(
    (data: Taskgroup) => {
      setTaskGroup(data);
    },
    (error: Error | unknown) => {
      console.error("Taskgroup creation failed: ", error);
      pushNotification({
        title: "Taskgroup creation failed",
        variant: "danger",
      });
    }
  );

  // Submit taskgroup mutation
  const { mutate: submitTaskgroupMutate } = useSubmitTaskgroupMutation(
    (_data: Taskgroup) => {
      pushNotification({
        title: "Applications",
        message: "Submitted for analysis",
        variant: "info",
      });
    },
    (_error: Error | unknown) => {
      pushNotification({
        title: "Taskgroup submit failed",
        variant: "danger",
      });
    }
  );

  // Delete taskgroup mutation
  const { mutate: deleteTaskgroupMutate } = useDeleteTaskgroupMutation(
    () => {
      setTaskGroup(null);
    },
    (_error: Error | unknown) => {
      pushNotification({
        title: "Taskgroup: delete failed",
        variant: "danger",
      });
    }
  );

  /**
   * Creates a new taskgroup if one doesn't already exist
   * @returns The created or existing taskgroup
   */
  const createTaskGroup = async (
    taskgroupData?: New<Taskgroup>
  ): Promise<Taskgroup> => {
    if (!taskGroup) {
      const newTaskGroup = await createTaskgroupAsync(
        taskgroupData || defaultTaskgroup
      );
      return newTaskGroup;
    }
    return taskGroup;
  };

  /**
   * Submits the taskgroup for analysis
   * @param taskgroup The taskgroup to submit
   */
  const submitTaskGroup = (taskgroup: Taskgroup) => {
    submitTaskgroupMutate(taskgroup);
  };

  /**
   * Deletes a taskgroup by ID
   * @param id The taskgroup ID to delete
   */
  const deleteTaskGroup = (id: number) => {
    deleteTaskgroupMutate(id);
  };

  /**
   * Updates the taskgroup state directly
   * @param newTaskGroup The new taskgroup state (or null to clear)
   */
  const updateTaskGroup = (newTaskGroup: Taskgroup | null) => {
    setTaskGroup(newTaskGroup);
  };

  return {
    taskGroup,
    createTaskGroup,
    submitTaskGroup,
    deleteTaskGroup,
    updateTaskGroup,
  };
};
