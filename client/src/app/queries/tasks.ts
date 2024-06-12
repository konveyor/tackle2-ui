import { useMutation, useQuery } from "@tanstack/react-query";

import {
  cancelTask,
  deleteTask,
  getServerTasks,
  getTaskById,
  getTaskByIdAndFormat,
  getTaskQueue,
  getTasks,
  getTextFile,
} from "@app/api/rest";
import { universalComparator } from "@app/utils/utils";
import {
  HubPaginatedResult,
  HubRequestParams,
  Task,
  TaskQueue,
} from "@app/api/models";

interface FetchTasksFilters {
  addon?: string;
}

export const TasksQueryKey = "tasks";
export const TasksQueueKey = "TasksQueue";
export const TaskByIDQueryKey = "taskByID";
export const TaskAttachmentByIDQueryKey = "taskAttachmentByID";

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
        .sort((a, b) =>
          a.application.id !== b.application.id
            ? a.application.id - b.application.id
            : -1 * universalComparator(a.createTime, b.createTime)
        )
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

export const useServerTasks = (params: HubRequestParams = {}) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [TasksQueryKey, params],
    queryFn: async () => await getServerTasks(params),
    onError: (error) => console.log("error, ", error),
    keepPreviousData: true,
  });

  return {
    result: {
      data: data?.data,
      total: data?.total ?? 0,
      params: data?.params ?? params,
    } as HubPaginatedResult<Task>,
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

export const useFetchTaskByIdAndFormat = ({
  taskId,
  format = "json",
  merged = false,
  enabled = true,
}: {
  taskId?: number;
  format?: "json" | "yaml";
  merged?: boolean;
  enabled?: boolean;
}) => {
  const { isLoading, error, data, refetch } = useQuery({
    queryKey: [TaskByIDQueryKey, taskId, format, merged],
    queryFn: () =>
      taskId ? getTaskByIdAndFormat(taskId, format, merged) : undefined,
    enabled,
  });

  return {
    task: data,
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useFetchTaskAttachmentById = ({
  attachmentId,
  enabled = true,
}: {
  attachmentId?: number;
  enabled?: boolean;
}) => {
  const { isLoading, error, data, refetch } = useQuery({
    queryKey: [TaskAttachmentByIDQueryKey, attachmentId],
    queryFn: () => (attachmentId ? getTextFile(attachmentId) : undefined),
    enabled,
  });

  return {
    attachment: data,
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useFetchTaskByID = (taskId?: number) => {
  const { isLoading, error, data, refetch } = useQuery({
    queryKey: [TaskByIDQueryKey, taskId],
    queryFn: () => (taskId ? getTaskById(taskId) : null),
    enabled: !!taskId,
  });

  return {
    task: data,
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

/** Fetch the TaskQueue counts. Defaults to `0` for all counts. */
export const useFetchTaskQueue = (addon?: string) => {
  const { data, error, refetch, isFetching } = useQuery({
    queryKey: [TasksQueueKey, addon],
    queryFn: () => getTaskQueue(addon),
    refetchInterval: 5000,
    initialData: {
      total: 0,
      ready: 0,
      postponed: 0,
      pending: 0,
      running: 0,
    } as TaskQueue,
  });

  return {
    taskQueue: data,
    isFetching,
    error,
    refetch,
  };
};
