import { useMutation, useQuery } from "@tanstack/react-query";

import { cancelTask, deleteTask, getTasks } from "@app/api/rest";

interface FetchTasksFilters {
  addon?: string;
}

export const TasksQueryKey = "tasks";

export const useFetchTasks = (filters: FetchTasksFilters = {}) => {
  const { isLoading, error, refetch, data } = useQuery({
    queryKey: [TasksQueryKey],
    queryFn: getTasks,
    refetchInterval: 5000,
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
