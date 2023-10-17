import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createTaskgroup,
  deleteTaskgroup,
  removeFileTaskgroup,
  submitTaskgroup,
  uploadFileTaskgroup,
} from "@app/api/rest";
import { IReadFile, Taskgroup } from "@app/api/models";
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

export const useRemoveUploadedFileMutation = (
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
export const useUploadFileTaskgroupMutation = (
  successCallback?: (data: AxiosResponse<Taskgroup>) => void,
  errorCallback?: (err: AxiosError) => void
) => {
  return useMutation({
    mutationFn: uploadFileTaskgroup,
    mutationKey: ["upload"],
    onSuccess: (data) => {
      successCallback && successCallback(data);
    },
    onError: (err: AxiosError) => {
      errorCallback && errorCallback(err);
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

export const useUploadFileMutation = (
  onSuccess: (
    data: AxiosResponse<Taskgroup>,
    id: number,
    path: string,
    formData: any,
    file: IReadFile
  ) => void,
  errorCallback: (err: AxiosError) => void
) => {
  return useMutation({
    mutationFn: uploadFileTaskgroup,
    onSuccess: (data, { id, path, formData, file }) => {
      onSuccess(data, id, path, formData, file);
    },
    onError: (err: AxiosError) => {
      errorCallback && errorCallback(err);
    },
  });
};
