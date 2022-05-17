import { useMutation, useQuery } from "react-query";

import { Task } from "@app/api/models";
import { deleteTask, getTasks } from "@app/api/rest";

export const useFetchTasks = () => {
  const { isLoading, error, refetch, data } = useQuery("tasks", getTasks, {
    refetchInterval: 5000,
    select: (allTasks) => {
      let uniqLatestTasks: Task[] = [];
      allTasks.forEach((task) => {
        const aTask = uniqLatestTasks.find(
          (item) => task.application?.id === item.application?.id
        );
        if (!aTask) {
          uniqLatestTasks.push(task);
        } else if (
          aTask?.createTime &&
          task?.createTime &&
          task.createTime > aTask.createTime
        ) {
          const others = uniqLatestTasks.filter((t) => t.id !== aTask.id);
          uniqLatestTasks = [...others, task];
        }
      });
      return uniqLatestTasks;
    },
    onError: (err) => console.log(err),
  });

  return {
    tasks: data || [],
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
