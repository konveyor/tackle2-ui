import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { Taskgroup } from "@app/api/models";
import {
  createTaskgroup,
  deleteTaskgroup,
  removeFileTaskgroup,
  submitTaskgroup,
  uploadFileTaskgroup,
} from "@app/api/rest";

import { TasksQueryKey } from "./tasks";

export const useCreateTaskgroupMutation = (
  onSuccess?: (data: Taskgroup) => void,
  onError?: (err: Error | unknown) => void
) => useMutation({ mutationFn: createTaskgroup, onSuccess, onError });

export const useSubmitTaskgroupMutation = (
  onSuccess?: (taskGroup: Taskgroup) => void,
  onError?: (err: Error | unknown) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitTaskgroup,
    onSuccess: (_, taskGroup) => {
      queryClient.invalidateQueries({ queryKey: [TasksQueryKey] });
      onSuccess?.(taskGroup);
    },
    onError: (err) => {
      queryClient.invalidateQueries({ queryKey: [TasksQueryKey] });
      onError?.(err);
    },
  });
};

export const useRemoveTaskgroupFileMutation = (
  successCallback?: () => void,
  errorCallback?: (err: AxiosError) => void
) => {
  return useMutation({
    mutationFn: removeFileTaskgroup,
    onSuccess: () => {
      successCallback?.();
    },
    onError: (err: AxiosError) => {
      errorCallback?.(err);
    },
  });
};

export const useUploadTaskgroupFileMutation = (
  successCallback?: (params: Parameters<typeof uploadFileTaskgroup>[0]) => void,
  errorCallback?: (
    err: AxiosError,
    params: Parameters<typeof uploadFileTaskgroup>[0]
  ) => void
) => {
  return useMutation({
    mutationFn: uploadFileTaskgroup,
    onSuccess: (_, params) => {
      successCallback?.(params);
    },
    onError: (err: AxiosError, params) => {
      errorCallback?.(err, params);
    },
  });
};

export const useDeleteTaskgroupMutation = (
  onSuccess: () => void,
  onError: (err: Error | unknown) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTaskgroup,
    onSuccess,
    onError: (err) => {
      onError(err);
      queryClient.invalidateQueries({ queryKey: [TasksQueryKey] });
    },
  });
};
