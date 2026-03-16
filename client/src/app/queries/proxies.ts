import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import { getProxies, updateProxy } from "@app/api/rest";

export const ProxiesTasksQueryKey = "proxies";

export const useFetchProxies = (
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { isLoading, data, error } = useQuery({
    queryKey: [ProxiesTasksQueryKey],
    queryFn: getProxies,
    onError: (error) => console.log("error, ", error),
    refetchInterval,
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
      queryClient.invalidateQueries({ queryKey: [ProxiesTasksQueryKey] });
    },
    onError: onError,
  });
};
