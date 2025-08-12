import { useQuery } from "@tanstack/react-query";

import { AxiosError } from "axios";
import {
  getSchemas,
  getSchemaByName,
  getPlatformCoordinatesSchema,
  getPlatformDiscoveryFilterSchema,
} from "@app/api/rest";

export const SCHEMAS_QUERY_KEY = "schemas";
export const SCHEMA_QUERY_KEY = "schema";
export const PLATFORM_COORDINATES_SCHEMA_QUERY_KEY =
  "platformCoordinatesSchema";
export const PLATFORM_DISCOVERY_FILTER_SCHEMA_QUERY_KEY =
  "platformDiscoveryFilterSchema";

export const useFetchSchemas = (refetchInterval: number | false = false) => {
  const { isLoading, isSuccess, error, refetch, data } = useQuery({
    queryKey: [SCHEMAS_QUERY_KEY],
    queryFn: getSchemas,
    onError: (error: AxiosError) => console.log(error),
    refetchInterval,
  });

  return {
    schemas: data,
    isLoading,
    isSuccess,
    fetchError: error,
    refetch,
  };
};

export const useFetchSchemaByName = (name?: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: [SCHEMA_QUERY_KEY, name],
    queryFn: () =>
      name === undefined ? Promise.resolve(undefined) : getSchemaByName(name),
    onError: (error: AxiosError) => console.log("error, ", error),
    enabled: name !== undefined,
  });

  return {
    schema: data,
    isLoading,
    fetchError: error,
  };
};

export const useFetchPlatformCoordinatesSchema = (platformKind?: string) => {
  const { data, isLoading, error } = useQuery({
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
