import { useState } from "react";
import { AxiosError } from "axios";
import { createAsyncAction, getType } from "typesafe-actions";
import { createTask, getProxies, PROXIES, updateProxy } from "@app/api/rest";
import { Proxy, Task } from "@app/api/models";
import { useMutation, UseMutationResult, useQuery } from "react-query";
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
  currentTask: any;
  isFetching: boolean;
  fetchError: any;
}

export const useFetchTask = (
  defaultIsFetching: boolean = false,
  taskID: any
): IFetchState => {
  const [task, setTask] = useState<Array<Task>>([]);
  const { isLoading, isError, data, error } = useQuery("repoData", () =>
    getProxies()
      .then((res) => res)
      .then(({ data }) => {
        setTask(data);
      })
      .catch((error) => {
        console.log("error, ", error);
      })
  );
  return {
    currentTask: task,
    isFetching: isLoading,
    fetchError: error,
  };
};

export interface IMutateState {
  mutate: any;
  postResult: any;
  isLoading: boolean;
  error: any;
}

export const useCreateInitialTaskMutation = (onSuccess: any): IMutateState => {
  const [postResult, setPostResult] = useState<any>(null);

  const { isLoading, mutate, error } = useMutation(createTask, {
    onSuccess: (res) => {
      onSuccess();
      setPostResult(res);
    },
    onError: (err) => {
      setPostResult(err);
    },
  });
  return {
    mutate,
    postResult,
    isLoading,
    error,
  };
};
