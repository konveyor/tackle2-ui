import { useState } from "react";
import { AxiosError } from "axios";
import { createAsyncAction, getType } from "typesafe-actions";
import { getProxies, PROXIES, updateProxy } from "@app/api/rest";
import { Proxy } from "@app/api/models";
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
  proxies: any;
  isFetching: boolean;
  fetchError: any;
}

export const useFetchProxies = (
  defaultIsFetching: boolean = false
): IFetchState => {
  const [proxies, setProxies] = useState<Array<Proxy>>([]);
  const { isLoading, isError, data, error } = useQuery("repoData", () =>
    getProxies()
      .then((res) => res)
      .then(({ data }) => {
        setProxies(data);
      })
      .catch((error) => {
        console.log("error, ", error);
      })
  );
  return {
    proxies: proxies,
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

  const { isLoading, mutate, error } = useMutation(updateProxy, {
    onSuccess: (res) => {
      onSuccess();
      setPutResult(res);
    },
    onError: (err) => {
      setPutResult(err);
    },
  });
  return {
    mutate,
    putResult,
    isLoading,
    error,
  };
};
