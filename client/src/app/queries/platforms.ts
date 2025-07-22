import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AxiosError } from "axios";
import { SourcePlatform } from "@app/api/models";
import {
  createPlatform,
  deletePlatform,
  getPlatformById,
  getPlatforms,
  updatePlatform,
} from "@app/api/rest";
import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";

export const PLATFORMS_QUERY_KEY = "platforms";
export const PLATFORM_QUERY_KEY = "platform";

export const useFetchPlatforms = (
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { isLoading, isSuccess, error, refetch, data } = useQuery({
    queryKey: [PLATFORMS_QUERY_KEY],
    queryFn: getPlatforms,
    onError: (error: AxiosError) => console.log(error),
    refetchInterval,
  });

  return {
    platforms: data,
    isFetching: isLoading,
    isSuccess,
    error,
    refetch,
  };
};

export const useFetchPlatformById = (
  id?: number | string,
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { data, isLoading, error } = useQuery({
    queryKey: [PLATFORM_QUERY_KEY, id],
    queryFn: () =>
      id === undefined ? Promise.resolve(undefined) : getPlatformById(id),
    onError: (error: AxiosError) => console.log("error, ", error),
    enabled: id !== undefined,
    refetchInterval,
  });

  return {
    platform: data,
    isFetching: isLoading,
    fetchError: error,
  };
};

export const useCreatePlatformMutation = (
  onSuccess: () => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPlatform,
    onSuccess: () => {
      onSuccess();
      queryClient.invalidateQueries({ queryKey: [PLATFORMS_QUERY_KEY] });
    },
    onError: onError,
  });
};

export const useUpdatePlatformMutation = (
  onSuccess: (id: number) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePlatform,
    onSuccess: (_, { id }) => {
      onSuccess(id);
      queryClient.invalidateQueries({ queryKey: [PLATFORMS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [PLATFORM_QUERY_KEY, id] });
    },
    onError: onError,
  });
};

export const useDeletePlatformMutation = (
  onSuccess: (platform: SourcePlatform) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (platform: SourcePlatform) => deletePlatform(platform.id),
    onSuccess: (_, platform) => {
      onSuccess(platform);
      queryClient.invalidateQueries({ queryKey: [PLATFORMS_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [PLATFORM_QUERY_KEY, platform.id],
      });
    },
    onError: onError,
  });
};
