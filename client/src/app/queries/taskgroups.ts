import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createTaskgroup,
  deleteTaskgroup,
  removeFileTaskgroup,
  submitTaskgroup,
  uploadFileTaskgroup,
} from "@app/api/rest";
import { Taskgroup } from "@app/api/models";
import { AxiosError, AxiosResponse } from "axios";
import { TasksQueryKey } from "./tasks";

export const useCreateTaskgroupMutation = (
  onSuccess: (data: Taskgroup) => void,
  onError: (err: Error | unknown) => void
) => useMutation({ mutationFn: createTaskgroup, onSuccess, onError });

export const useSubmitTaskgroupMutation = (
  onSuccess: (data: Taskgroup) => void,
  onError: (err: Error | unknown) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitTaskgroup,
    onSuccess: (data) => {
      onSuccess(data);
      queryClient.invalidateQueries([TasksQueryKey]);
    },
    onError: (err) => {
      onError(err);
      queryClient.invalidateQueries([TasksQueryKey]);
    },
  });
};

export const useRemoveTaskgroupFileMutation = (
  successCallback?: (data: AxiosResponse<Taskgroup>) => void,
  errorCallback?: (err: AxiosError) => void
) => {
  return useMutation({
    mutationFn: removeFileTaskgroup,
    onSuccess: (data) => {
      successCallback && successCallback(data);
    },
    onError: (err: AxiosError) => {
      errorCallback && errorCallback(err);
    },
  });
};

export const useUploadTaskgroupFileMutation = (
  successCallback?: (
    data: AxiosResponse<void>,
    params: Parameters<typeof uploadFileTaskgroup>[0]
  ) => void,
  errorCallback?: (
    err: AxiosError,
    params: Parameters<typeof uploadFileTaskgroup>[0]
  ) => void
) => {
  return useMutation({
    mutationFn: uploadFileTaskgroup,
    onSuccess: (response, params) => {
      successCallback?.(response, params);
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
      queryClient.invalidateQueries([TasksQueryKey]);
    },
  });
};
