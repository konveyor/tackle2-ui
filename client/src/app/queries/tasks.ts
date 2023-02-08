import { useMutation, useQuery } from "react-query";

import { Task } from "@app/api/models";
import { cancelTask, deleteTask, getTasks } from "@app/api/rest";

interface FetchTasksFilters {
  addon?: string;
  notAddons?: string[];
}

export const useFetchTasks = (filters: FetchTasksFilters = {}) => {
  const { isLoading, error, refetch, data } = useQuery("tasks", getTasks, {
    refetchInterval: 5000,
    select: (allTasks) => {
      const filteredTasks = filters
        ? allTasks.filter((task) => {
          return (!filters.addon || task.addon === filters.addon) &&
            (!filters.notAddons || !filters.notAddons.includes(task.addon))
        })
        : allTasks;
      let uniqLatestTasks: Task[] = [];
      filteredTasks.forEach((task) => {
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

export const useFetchAllTasks = (filters: FetchTasksFilters = {}) => {
  const { isLoading, error, refetch, data } = useQuery("tasks", getTasks, {
    refetchInterval: 5000,
    select: (allTasks) => {
      const filteredTasks = filters
        ? allTasks.filter((task) => {
          return (!filters.addon || task.addon === filters.addon) &&
            (!filters.notAddons || !filters.notAddons.includes(task.addon))
        })
        : allTasks;
      return filteredTasks;
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

export const useCancelTaskMutation = (
  onSuccess: () => void,
  onError: (err: Error | null) => void
) => {
  return useMutation(cancelTask, {
    onSuccess: () => {
      onSuccess && onSuccess();
    },
    onError: (err: Error) => {
      onError && onError(err);
    },
  });
};
