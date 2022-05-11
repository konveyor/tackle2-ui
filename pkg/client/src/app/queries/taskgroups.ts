import { useMutation, useQueryClient } from "react-query";

import {
  createTaskgroup,
  deleteTaskgroup,
  submitTaskgroup,
  uploadFileTaskgroup,
} from "@app/api/rest";
import { Taskgroup } from "@app/api/models";
import { AxiosError } from "axios";

export const useCreateTaskgroupMutation = (
  onSuccess: (res: any) => void,
  onError: (err: Error | unknown) => void
) =>
  useMutation(createTaskgroup, {
    onSuccess: (data) => {
      onSuccess(data);
    },
    onError: (err) => {
      onError(err);
    },
  });

export const useSubmitTaskgroupMutation = (
  onSuccess: (data: Taskgroup) => void,
  onError: (err: Error | unknown) => void
) => {
  const queryClient = useQueryClient();

  return useMutation(submitTaskgroup, {
    onSuccess: (data) => {
      onSuccess(data);
      queryClient.invalidateQueries("tasks");
    },
    onError: (err) => {
      onError(err);
      queryClient.invalidateQueries("tasks");
    },
  });
};

export const useUploadFileTaskgroupMutation = (
  successCallback: (res: any) => void,
  errorCallback: (err: AxiosError) => void
) => {
  return useMutation(uploadFileTaskgroup, {
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
    onSuccess: () => {
      onSuccess();
    },
    onError: (err) => {
      onError(err);
      queryClient.invalidateQueries("tasks");
    },
  });
};

export const useUploadFileMutation = (
  successCallback: (res: any) => void,
  errorCallback: (err: Error | null) => void
) => {
  return useMutation(uploadFileTaskgroup, {
    onSuccess: (res) => {
      successCallback && successCallback(res);
    },
    onError: (err: Error) => {
      errorCallback && errorCallback(err);
    },
  });
};
