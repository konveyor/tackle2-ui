import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  cancelTask,
  cancelTasks,
  createTask,
  deleteTask,
  getServerTasks,
  getTaskById,
  getTaskByIdAndFormat,
  getTaskQueue,
  getTasksDashboard,
  getTextFileById,
  submitTask,
  updateTask,
} from "@app/api/rest";
import { universalComparator } from "@app/utils/utils";
import {
  HubPaginatedResult,
  HubRequestParams,
  Task,
  TaskQueue,
  TaskDashboard,
  ApplicationTask,
} from "@app/api/models";
import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";

export const TaskStates = {
  Canceled: ["Canceled"],
  Created: ["Created"],
  Failed: ["Failed"],
  Queued: ["Ready", "Postponed", "Pending", "Running"], // "Created", "QuotaBlocked" ??
  Running: ["Running"],
  Success: ["Succeeded", "SucceededWithErrors"],
  SuccessWithErrors: ["SucceededWithErrors"],
  Terminal: ["Succeeded", "SucceededWithErrors", "Failed", "Canceled"],
};

export const TasksQueryKey = "tasks";
export const TasksQueueKey = "tasksQueue";
export const TaskByIDQueryKey = "taskByID";
export const TaskAttachmentByIDQueryKey = "taskAttachmentByID";

/**
 * Rebuild the __state__ of a Task to include the UI synthetic "SucceededWithErrors"
 */
const calculateSyntheticTaskState = (task: Task): Task => {
  if (task.state === "Succeeded" && (task.errors?.length ?? 0) > 0) {
    task.state = "SucceededWithErrors";
  }

  return task;
};

/**
 * Rebuild the __state__ of a TaskDashboard to include the UI synthetic "SucceededWithErrors"
 */
const calculateSyntheticTaskDashboardState = (
  task: TaskDashboard
): TaskDashboard => {
  if (task.state === "Succeeded" && (task?.errors ?? 0) > 0) {
    task.state = "SucceededWithErrors";
  }

  return task;
};

export const useFetchTaskDashboard = (refetchDisabled: boolean = false) => {
  const { isLoading, error, refetch, data } = useQuery({
    queryKey: [TasksQueryKey, "/report/dashboard"],
    queryFn: getTasksDashboard,
    select: (tasks) =>
      tasks
        .map(calculateSyntheticTaskDashboardState)
        .sort((a, b) => -1 * universalComparator(a.createTime, b.createTime)),
    onError: (err) => console.log(err),
    refetchInterval: !refetchDisabled ? DEFAULT_REFETCH_INTERVAL : false,
  });

  const hasActiveTasks =
    data?.some((task) => TaskStates.Queued.includes(task.state ?? "")) ?? false;

  return {
    tasks: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
    hasActiveTasks,
  };
};

export const useInfiniteServerTasks = (
  initialParams: HubRequestParams,
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  return useInfiniteQuery({
    // usually the params are part of the key
    // infinite query tracks the actual params for all pages under one key
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [TasksQueryKey],
    queryFn: async ({ pageParam = initialParams }) =>
      await getServerTasks(pageParam),
    getNextPageParam: (lastPage) => {
      const pageNumber = lastPage?.params.page?.pageNumber ?? 0;
      const itemsPerPage = lastPage?.params.page?.itemsPerPage ?? 20;
      const total = lastPage?.total ?? 0;
      if (total <= pageNumber * itemsPerPage) {
        return undefined;
      }

      return {
        ...lastPage.params,
        page: {
          pageNumber: pageNumber + 1,
          itemsPerPage,
        },
      };
    },
    select: (infiniteData) => {
      infiniteData?.pages?.forEach((page) => {
        if (page.data?.length > 0) {
          page.data = page.data.map(calculateSyntheticTaskState);
        }
      });
      return infiniteData;
    },
    onError: (error: Error) => console.log("error, ", error),
    keepPreviousData: true,
    refetchInterval,
  });
};

export const useServerTasks = (
  params: HubRequestParams,
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [TasksQueryKey, params],
    queryFn: async () => await getServerTasks(params),
    select: (data) => {
      if (data?.data?.length > 0) {
        data.data = data.data.map(calculateSyntheticTaskState);
      }
      return data;
    },
    onError: (error: Error) => console.log("error, ", error),
    keepPreviousData: true,
    refetchInterval,
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
  onSuccess?: () => void,
  onError?: (err: Error | null) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTask,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [TasksQueryKey] });
      queryClient.invalidateQueries({ queryKey: [TaskByIDQueryKey, id] });
      onSuccess?.();
    },
    onError: (err: Error) => {
      onError?.(err);
    },
  });
};

export const useCancelTaskMutation = (
  onSuccess?: (statusCode: number) => void,
  onError?: (err: Error | null) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelTask,
    onSuccess: ({ status }, id) => {
      queryClient.invalidateQueries({ queryKey: [TasksQueryKey] });
      queryClient.invalidateQueries({ queryKey: [TaskByIDQueryKey, id] });
      onSuccess?.(status);
    },
    onError: (err: Error) => {
      onError?.(err);
    },
  });
};

export const useCancelTasksMutation = (
  onSuccess?: (statusCode: number) => void,
  onError?: (err: Error | null) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelTasks,
    onSuccess: ({ status }, data) => {
      queryClient.invalidateQueries({ queryKey: [TasksQueryKey] });
      data.forEach((id) => {
        queryClient.invalidateQueries({ queryKey: [TaskByIDQueryKey, id] });
      });
      onSuccess?.(status);
    },
    onError: (err: Error) => {
      onError?.(err);
    },
  });
};

export const useUpdateTaskMutation = (
  onSuccess?: (statusCode: number) => void,
  onError?: (err: Error | null) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTask,
    onSuccess: ({ status, data }) => {
      queryClient.invalidateQueries({ queryKey: [TasksQueryKey] });
      queryClient.invalidateQueries({ queryKey: [TaskByIDQueryKey, data.id] });
      onSuccess?.(status);
    },
    onError: (err: Error) => {
      onError?.(err);
    },
  });
};

export const useCreateTaskMutation = (
  onSuccess?: (task: ApplicationTask) => void,
  onError?: (err: Error) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTask,
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: [TasksQueryKey] });
      queryClient.invalidateQueries({ queryKey: [TaskByIDQueryKey, task.id] });
      onSuccess?.(task);
    },
    onError: (err: Error) => {
      onError?.(err);
    },
  });
};

export const useSubmitTaskMutation = (
  onSuccess?: (task: Task) => void,
  onError?: (err: Error) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitTask,
    onSuccess: (_, task: Task) => {
      queryClient.invalidateQueries({ queryKey: [TasksQueryKey] });
      queryClient.invalidateQueries({ queryKey: [TaskByIDQueryKey, task.id] });
      onSuccess?.(task);
    },
    onError: (err: Error) => {
      onError?.(err);
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
    queryFn: () => (attachmentId ? getTextFileById(attachmentId) : undefined),
    enabled,
  });

  return {
    attachment: data,
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useFetchTaskByID = (
  taskId?: number,
  refetchInterval: number | false = false
) => {
  const { isLoading, error, data, refetch } = useQuery({
    queryKey: [TaskByIDQueryKey, taskId],
    queryFn: () => (taskId ? getTaskById(taskId) : null),
    select: (task: Task | null) =>
      !task ? null : calculateSyntheticTaskState(task),
    enabled: !!taskId,
    refetchInterval,
  });

  return {
    task: data,
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

/** Fetch the TaskQueue counts. Defaults to `0` for all counts. */
export const useFetchTaskQueue = (
  addon?: string,
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { data, error, refetch, isFetching } = useQuery({
    queryKey: [TasksQueueKey, addon],
    queryFn: () => getTaskQueue(addon),
    refetchInterval,
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
