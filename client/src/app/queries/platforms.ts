import { useMemo } from "react";
import {
  UseQueryOptions,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { unique } from "radash";

import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import { SourcePlatform, TargetedSchema } from "@app/api/models";
import {
  createPlatform,
  deletePlatform,
  getPlatformById,
  getPlatformCoordinatesSchema,
  getPlatforms,
  updatePlatform,
} from "@app/api/rest";

import { PLATFORM_COORDINATES_SCHEMA_QUERY_KEY } from "./schemas";

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
    platforms: data || [],
    isFetching: isLoading,
    isLoading,
    isSuccess,
    error,
    refetch,
  };
};

export const useFetchPlatformsWithCoordinatesSchemas = (
  refetchInterval: number | false = false
) => {
  const {
    platforms,
    isLoading: isPlatformsLoading,
    isSuccess: isPlatformsSuccess,
    error: platformsError,
  } = useFetchPlatforms(refetchInterval);

  const uniqueKinds = useMemo(
    () => unique(platforms.map((platform) => platform.kind)),
    [platforms]
  );

  const schemaResults = useQueries({
    queries: uniqueKinds.map<UseQueryOptions<TargetedSchema>>((kind) => ({
      queryKey: [PLATFORM_COORDINATES_SCHEMA_QUERY_KEY, kind],
      queryFn: () => getPlatformCoordinatesSchema(kind),
      refetchInterval: false,
      staleTime: Infinity,
    })),
  });

  const aggregatedSchemaResults = useMemo(
    () => ({
      isLoading: schemaResults.some((result) => result.isLoading),
      isFetching: schemaResults.some((result) => result.isFetching),
      isSuccess: schemaResults.every((result) => result.isSuccess),
      errors: schemaResults.map(({ error }) => error).filter(Boolean),
      schemasByKind: Object.fromEntries(
        uniqueKinds.map((kind, index) => [kind, schemaResults[index].data])
      ),
    }),
    [schemaResults, uniqueKinds]
  );

  const platformsWithSchemas = useMemo(() => {
    const { schemasByKind } = aggregatedSchemaResults;
    return platforms.map((platform) => ({
      ...platform,
      coordinatesSchema: schemasByKind[platform.kind],
    }));
  }, [platforms, aggregatedSchemaResults]);

  return {
    platforms: platformsWithSchemas,
    isLoading: isPlatformsLoading || aggregatedSchemaResults.isLoading,
    isSuccess: isPlatformsSuccess && aggregatedSchemaResults.isSuccess,
    error:
      platformsError ||
      (aggregatedSchemaResults.errors.length > 0
        ? aggregatedSchemaResults.errors[0]
        : null),
  };
};

export const useFetchPlatformById = (
  id?: number | string,
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { data, isLoading, isSuccess, error } = useQuery({
    queryKey: [PLATFORM_QUERY_KEY, id],
    queryFn: () =>
      id === undefined ? Promise.resolve(undefined) : getPlatformById(id),
    onError: (error: AxiosError) => console.log("error, ", error),
    enabled: id !== undefined,
    refetchInterval,
  });

  return {
    platform: data,
    isLoading,
    isSuccess,
    fetchError: error,
  };
};

export const useCreatePlatformMutation = (
  onSuccess: (platform: SourcePlatform) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPlatform,
    onSuccess: (platform, _variables) => {
      queryClient.invalidateQueries({ queryKey: [PLATFORMS_QUERY_KEY] });
      onSuccess(platform);
    },
    onError: onError,
  });
};

export const useUpdatePlatformMutation = (
  onSuccess: (platform: SourcePlatform) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePlatform,
    onSuccess: (_, platform) => {
      queryClient.invalidateQueries({ queryKey: [PLATFORMS_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [PLATFORM_QUERY_KEY, platform.id],
      });
      onSuccess(platform);
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
      queryClient.invalidateQueries({ queryKey: [PLATFORMS_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [PLATFORM_QUERY_KEY, platform.id],
      });
      onSuccess(platform);
    },
    onError: onError,
  });
};
