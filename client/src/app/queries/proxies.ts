import { AxiosError } from "axios";
import { getProxies, updateProxy } from "@app/api/rest";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";

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
