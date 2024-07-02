import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  cancelTask,
  deleteTask,
  getServerTasks,
  getTaskById,
  getTaskByIdAndFormat,
  getTaskQueue,
  getTasks,
  getTextFile,
  updateTask,
} from "@app/api/rest";
import { universalComparator } from "@app/utils/utils";
import {
  HubPaginatedResult,
  HubRequestParams,
  Task,
  TaskQueue,
} from "@app/api/models";

export const TaskStates = {
  Canceled: ["Canceled"],
  Created: ["Created"],
  Failed: ["Failed"],
  Queued: ["Ready", "Postponed", "Pending", "Running"], // "Created", "QuotaBlocked" ??
  Running: ["Running"],
  Success: ["Succeeded"],
};

export const TasksQueryKey = "tasks";
export const TasksQueueKey = "TasksQueue";
export const TaskByIDQueryKey = "taskByID";
export const TaskAttachmentByIDQueryKey = "taskAttachmentByID";

export const useFetchTasks = (refetchDisabled: boolean = false) => {
  const { isLoading, error, refetch, data } = useQuery({
    queryKey: [TasksQueryKey],
    queryFn: getTasks,
    refetchInterval: !refetchDisabled ? 5000 : false,
    select: (allTasks) => {
      // sort by createTime (newest to oldest)
      allTasks.sort(
        (a, b) => -1 * universalComparator(a.createTime, b.createTime)
      );
      return allTasks;
    },
    onError: (err) => console.log(err),
  });

  const hasActiveTasks =
    data && data.some((task) => TaskStates.Queued.includes(task.state ?? ""));

  return {
    tasks: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
    hasActiveTasks,
  };
};

export const useServerTasks = (
  params: HubRequestParams = {},
  refetchInterval?: number
) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [TasksQueryKey, params],
    queryFn: async () => await getServerTasks(params),
    onError: (error) => console.log("error, ", error),
    keepPreviousData: true,
    refetchInterval: refetchInterval ?? false,
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
  onSuccess: (statusCode: number) => void,
  onError: (err: Error | null) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelTask,
    onSuccess: (response) => {
      queryClient.invalidateQueries([TasksQueryKey]);
      onSuccess && onSuccess(response.status);
    },
    onError: (err: Error) => {
      onError && onError(err);
    },
  });
};

export const useUpdateTaskMutation = (
  onSuccess: (statusCode: number) => void,
  onError: (err: Error | null) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTask,
    onSuccess: (response) => {
      queryClient.invalidateQueries([TasksQueryKey]);
      onSuccess && onSuccess(response.status);
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
