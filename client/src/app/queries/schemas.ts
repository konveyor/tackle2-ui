import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import {
  getPlatformCoordinatesSchema,
  getPlatformDiscoveryFilterSchema,
} from "@app/api/rest";

export const PLATFORM_COORDINATES_SCHEMA_QUERY_KEY =
  "platformCoordinatesSchema";
const PLATFORM_DISCOVERY_FILTER_SCHEMA_QUERY_KEY =
  "platformDiscoveryFilterSchema";

export const useFetchPlatformCoordinatesSchema = (platformKind?: string) => {
  const { data, isLoading, isSuccess, error } = useQuery({
    queryKey: [PLATFORM_COORDINATES_SCHEMA_QUERY_KEY, platformKind],
    queryFn: () =>
      platformKind === undefined
        ? Promise.resolve(undefined)
        : getPlatformCoordinatesSchema(platformKind),
    onError: (error: AxiosError) => console.log("error, ", error),
    enabled: platformKind !== undefined,
  });

  return {
    coordinatesSchema: data,
    isLoading,
    isSuccess,
    fetchError: error,
  };
};

export const useFetchPlatformDiscoveryFilterSchema = (
  platformKind?: string
) => {
  const { data, isLoading, isSuccess, error } = useQuery({
    queryKey: [PLATFORM_DISCOVERY_FILTER_SCHEMA_QUERY_KEY, platformKind],
    queryFn: () =>
      platformKind === undefined
        ? Promise.resolve(undefined)
        : getPlatformDiscoveryFilterSchema(platformKind),
    onError: (error: AxiosError) => console.log("error, ", error),
    enabled: platformKind !== undefined,
  });

  return {
    filtersSchema: data,
    isLoading,
    isSuccess,
    fetchError: error,
  };
};
