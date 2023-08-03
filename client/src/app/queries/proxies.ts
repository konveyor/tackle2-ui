import { useState } from "react";
import { AxiosError } from "axios";
import { getProxies, updateProxy } from "@app/api/rest";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const ProxiesTasksQueryKey = "proxies";

export const useFetchProxies = () => {
  const { isLoading, data, error } = useQuery({
    queryKey: [ProxiesTasksQueryKey],
    queryFn: getProxies,
    onError: (error) => console.log("error, ", error),
  });
  return {
    proxies: data || [],
    isFetching: isLoading,
    fetchError: error as AxiosError,
  };
};

export const useUpdateProxyMutation = (
  onSuccess: () => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProxy,
    onSuccess: () => {
      onSuccess();
      queryClient.invalidateQueries([ProxiesTasksQueryKey]);
    },
    onError: onError,
  });
};
