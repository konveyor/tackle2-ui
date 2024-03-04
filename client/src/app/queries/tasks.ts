import { useMutation, useQuery } from "@tanstack/react-query";

import { cancelTask, deleteTask, getTaskById, getTasks } from "@app/api/rest";

interface FetchTasksFilters {
  addon?: string;
}

export const TasksQueryKey = "tasks";

export const useFetchTasks = (
  filters: FetchTasksFilters = {},
  refetchDisabled: boolean = false
) => {
  const { isLoading, error, refetch, data } = useQuery({
    queryKey: [TasksQueryKey],
    queryFn: getTasks,
    refetchInterval: !refetchDisabled ? 5000 : false,
    select: (allTasks) => {
      const uniqSorted = allTasks
        .filter((task) =>
          filters?.addon ? filters.addon === task.addon : true
        )
        // sort by application.id (ascending) then createTime (newest to oldest)
        .sort((a, b) => {
          if (a.application.id !== b.application.id) {
            return a.application.id - b.application.id;
          } else {
            const aTime = a?.createTime ?? "";
            const bTime = b?.createTime ?? "";
            return aTime < bTime ? 1 : aTime > bTime ? -1 : 0;
          }
        })
        // remove old tasks for each application
        .filter(
          (task, index, tasks) =>
            index === 0 ||
            task.application.id !== tasks[index - 1].application.id
        );

      return uniqSorted;
    },
    onError: (err) => console.log(err),
  });
  const hasActiveTasks = data && data.length > 0;

  return {
    tasks: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
    hasActiveTasks,
  };
};

export const useDeleteTaskMutation = (
  onSuccess: () => void,
  onError: (err: Error | null) => void
) => {
  return useMutation({
    mutationFn: deleteTask,
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
  return useMutation({
    mutationFn: cancelTask,
    onSuccess: () => {
      onSuccess && onSuccess();
    },
    onError: (err: Error) => {
      onError && onError(err);
    },
  });
};

export const TaskByIDQueryKey = "taskByID";

export const useFetchTaskByID = (
  taskId?: number,
  format = "json",
  merged = false
) => {
  console.log("useFetchTaskByID", taskId, format, merged);
  const { isLoading, error, data, refetch } = useQuery({
    queryKey: [TaskByIDQueryKey, taskId, format, merged],
    queryFn: () => (taskId ? getTaskById(taskId, format, merged) : null),
    enabled: !!taskId,
  });

  return {
    task: data,
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};
