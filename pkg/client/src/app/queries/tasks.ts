import { useState } from "react";
import { useMutation, useQuery } from "react-query";

import { Task } from "@app/api/models";
import { deleteTask, getTasks } from "@app/api/rest";

export const useFetchTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { isLoading, error, refetch } = useQuery("tasks", getTasks, {
    refetchInterval: 5000,
    onSuccess: (data) => {
      let uniqLatestTasks: Task[] = [];
      data.forEach((task) => {
        const aTask = uniqLatestTasks.find(
          (item) => task.application?.id === item.application?.id
        );
        if (
          aTask?.createTime &&
          task?.createTime &&
          task.createTime > aTask.createTime
        ) {
          const others = uniqLatestTasks.filter((t) => t.id !== aTask.id);
          uniqLatestTasks = [...others, task];
        } else uniqLatestTasks.push(task);
      });
      setTasks(uniqLatestTasks);
    },
    onError: (err) => {
      console.log(error);
    },
  });
  return {
    tasks,
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useDeleteTaskMutation = (
  onSuccess: () => void,
  onError: (err: Error | null) => void
) => {
  return useMutation(deleteTask, {
    onSuccess: () => {
      onSuccess && onSuccess();
    },
    onError: (err: Error) => {
      onError && onError(err);
    },
  });
};
