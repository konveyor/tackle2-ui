import { useMutation, useQuery } from "@tanstack/react-query";

import { deleteCache, getCache } from "@app/api/rest";
import { Cache } from "@app/api/models";

export const CacheQueryKey = "cache";

export const CleanProgressQueryKey = "cleanProgress";

export const useFetchCache = () => {
  const { data, isLoading, error, refetch } = useQuery<Cache>(
    [CacheQueryKey],
    async () => (await getCache()).data,
    {
      onError: (error) => console.log("error, ", error),
    }
  );
  return {
    cache: data || null,
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};
export const useDeleteCacheMutation = (
  onSuccess: () => void,
  onError: (err: Error | null) => void
) => {
  return useMutation(deleteCache, {
    onSuccess: () => {
      onSuccess && onSuccess();
    },
    onError: (err: Error) => {
      onError && onError(err);
    },
  });
};
