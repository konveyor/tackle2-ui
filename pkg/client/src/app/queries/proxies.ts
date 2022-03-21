import { useState } from "react";
import { AxiosError } from "axios";
import { createAsyncAction, getType } from "typesafe-actions";
import { getProxies, PROXIES, updateProxy } from "@app/api/rest";
import { Proxy } from "@app/api/models";
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
  const [proxies, setProxies] = useState<Array<Proxy>>([]);
  const { isLoading, refetch, isError, data, error } = useQuery("proxies", () =>
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
