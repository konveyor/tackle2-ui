import { useState } from "react";
import { AxiosError } from "axios";
import { createAsyncAction } from "typesafe-actions";
import { getProxies, updateProxy } from "@app/api/rest";
import { useMutation, useQuery, useQueryClient } from "react-query";

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
  proxies: any;
  isFetching: boolean;
  fetchError: any;
}

export const useFetchProxies = (
  defaultIsFetching: boolean = false
): IFetchState => {
  const { isLoading, refetch, isError, data, error } = useQuery(
    "proxies",
    getProxies,
    { onError: () => console.log("error, ", error) }
  );
  return {
    proxies: data || [],
    isFetching: isLoading,
    fetchError: error,
  };
};

export interface IMutateState {
  mutate: any;
  putResult: any;
  isLoading: boolean;
  error: any;
}

export const useUpdateProxyMutation = (onSuccess: any): IMutateState => {
  const [putResult, setPutResult] = useState<any>(null);
  const queryClient = useQueryClient();

  const { isLoading, mutate, error } = useMutation(updateProxy, {
    onSuccess: (res) => {
      onSuccess();
      setPutResult(res);
      queryClient.invalidateQueries("proxies");
    },
    onError: (err) => {
      setPutResult(err);
      queryClient.invalidateQueries("proxies");
    },
  });
  return {
    mutate,
    putResult,
    isLoading,
    error,
  };
};
