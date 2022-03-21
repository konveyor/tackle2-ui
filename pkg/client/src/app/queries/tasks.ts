import { useState } from "react";
import { AxiosError } from "axios";
import { createAsyncAction, getType } from "typesafe-actions";
import {
  createTask,
  getProxies,
  getTasks,
  PROXIES,
  updateProxy,
  uploadFileTask,
} from "@app/api/rest";
import { Proxy, Task } from "@app/api/models";
import {
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
} from "react-query";
import { ProxyFormValues } from "@app/pages/proxies/proxy-form";
import { APIClient } from "@app/axios-config";

export const {
  request: fetchRequest,
  success: fetchSuccess,
  failure: fetchFailure,
} = createAsyncAction(
  "useFetchProxies/fetch/request",
  "useFetchProxies/fetch/success",
  "useFetchProxies/fetch/failure"
)<void, any, AxiosError>();

export interface IFetchState {
  currentTasks: any;
  isFetching: boolean;
  fetchError: any;
}
export const useFetchTasks = (
  defaultIsFetching: boolean = false
): IFetchState => {
  const [tasks, setTasks] = useState<Array<Task>>([]);
  const { isLoading, isError, data, error } = useQuery("tasks", () =>
    getTasks()
      .then((res) => res)
      .then(({ data }) => {
        setTasks(data);
      })
      .catch((error) => {
        console.log("error, ", error);
      })
  );
  return {
    currentTasks: tasks,
    isFetching: isLoading,
    fetchError: error,
  };
};

export interface IMutateState {
  mutate: any;
  isLoading: boolean;
  error: any;
}

export const useCreateInitialTaskMutation = (callback: any): IMutateState => {
  const queryClient = useQueryClient();
  const { isLoading, mutate, error } = useMutation(createTask, {
    onSuccess: (res, context: any) => {
      callback && callback(res);
    },
    onError: (err) => {},
  });
  return {
    mutate,
    isLoading,
    error,
  };
};

export const useUploadLocalBinaryMutation = (
  successCallback: any,
  errorCallback: any
): IMutateState => {
  const { isLoading, mutate, error } = useMutation(uploadFileTask, {
    onSuccess: (res) => {
      successCallback && successCallback(res);
    },
    onError: (err) => {
      errorCallback && successCallback(err);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};
