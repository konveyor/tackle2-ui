import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createTaskgroup,
  deleteTaskgroup,
  removeFileTaskgroup,
  submitTaskgroup,
  uploadFileTaskgroup,
} from "@app/api/rest";
import { IReadFile, Taskgroup } from "@app/api/models";
import { AxiosError } from "axios";
import { TasksQueryKey } from "./tasks";

export const useCreateTaskgroupMutation = (
  onSuccess: (res: any) => void,
  onError: (err: Error | unknown) => void
) =>
  useMutation(createTaskgroup, {
    onSuccess,
    onError,
  });

export const useSubmitTaskgroupMutation = (
  onSuccess: (data: Taskgroup) => void,
  onError: (err: Error | unknown) => void
) => {
  const queryClient = useQueryClient();

  return useMutation(submitTaskgroup, {
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
  successCallback?: (res: any) => void,
  errorCallback?: (err: AxiosError) => void
) => {
  return useMutation(removeFileTaskgroup, {
    onSuccess: (res) => {
      successCallback && successCallback(res);
    },
    onError: (err: AxiosError) => {
      errorCallback && errorCallback(err);
    },
  });
};
export const useUploadFileTaskgroupMutation = (
  successCallback?: (res: any) => void,
  errorCallback?: (err: AxiosError) => void
) => {
  return useMutation(uploadFileTaskgroup, {
    mutationKey: ["upload"],
    onSuccess: (res) => {
      successCallback && successCallback(res);
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

  return useMutation(deleteTaskgroup, {
    onSuccess,
    onError: (err) => {
      onError(err);
      queryClient.invalidateQueries([TasksQueryKey]);
    },
  });
};

export const useUploadFileMutation = (
  onSuccess: (
    res: any,
    id: number,
    path: string,
    formData: any,
    file: IReadFile
  ) => void,
  errorCallback: (err: AxiosError) => void
) => {
  return useMutation(uploadFileTaskgroup, {
    onSuccess: (res, { id, path, formData, file }) => {
      onSuccess(res, id, path, formData, file);
    },
    onError: (err: AxiosError) => {
      errorCallback && errorCallback(err);
    },
  });
};
