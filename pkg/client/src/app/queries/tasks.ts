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

export interface IMutateState {
  mutate: any;
  isLoading: boolean;
  error: any;
}

export const useUploadFileMutation = (
  successCallback: any,
  errorCallback: any
): IMutateState => {
  const { isLoading, mutate, error } = useMutation(uploadFileTask, {
    onSuccess: (res) => {
      successCallback && successCallback(res);
    },
    onError: (err) => {
      errorCallback && errorCallback(err);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};
