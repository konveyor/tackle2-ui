import { useMutation, useQuery } from "@tanstack/react-query";

import { deleteCache, getCache } from "@app/api/rest";

export const CacheQueryKey = "cache";
export const CleanProgressQueryKey = "cleanProgress";

export const useFetchCache = () =>
  useQuery({
    queryKey: [CacheQueryKey],
    queryFn: getCache,
    onError: (error) => console.log("error, ", error),
  });

export const useDeleteCacheMutation = (
  onSuccess: () => void,
  onError: (err: Error | null) => void
) =>
  useMutation({
    mutationFn: deleteCache,
    onSuccess: onSuccess,
    onError: onError,
  });
