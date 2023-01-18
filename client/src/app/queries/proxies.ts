import { useState } from "react";
import { AxiosError } from "axios";
import { getProxies, updateProxy } from "@app/api/rest";
import { Proxy } from "@app/api/models";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface IProxyFetchState {
  proxies: Proxy[];
  isFetching: boolean;
  fetchError: AxiosError;
}

export const ProxiesTasksQueryKey = "proxies";

export const useFetchProxies = (
  defaultIsFetching: boolean = false
): IProxyFetchState => {
  const { isLoading, data, error } = useQuery(
    [ProxiesTasksQueryKey],
    async () => (await getProxies()).data,
    { onError: (error) => console.log("error, ", error) }
  );
  return {
    proxies: data || [],
    isFetching: isLoading,
    fetchError: error as AxiosError,
  };
};

export const useUpdateProxyMutation = (onSuccess: any) => {
  const [putResult, setPutResult] = useState<any>(null);
  const queryClient = useQueryClient();

  const { isLoading, mutate, error } = useMutation(updateProxy, {
    onSuccess: (res) => {
      onSuccess();
      setPutResult(res);
      queryClient.invalidateQueries([ProxiesTasksQueryKey]);
    },
    onError: (err) => {
      setPutResult(err);
      queryClient.invalidateQueries([ProxiesTasksQueryKey]);
    },
  });
  return {
    mutate,
    putResult,
    isLoading,
    error,
  };
};
