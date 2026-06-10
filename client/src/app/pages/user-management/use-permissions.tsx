import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { getPermissions } from "@app/api/rest";

import { Permission } from "./types";

export const PermissionsQueryKey = "permissions";

export const useFetchPermissions = () => {
  const { data, isLoading, error } = useQuery<Permission[], AxiosError>({
    queryKey: [PermissionsQueryKey],
    queryFn: getPermissions,
  });

  return {
    permissions: data ?? [],
    isFetching: isLoading,
    fetchError: error,
  };
};
