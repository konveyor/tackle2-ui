import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { Permission } from "@app/api/models";
import { getPermissions } from "@app/api/rest";

export const PermissionsQueryKey = "permissions";

export const useFetchPermissions = () => {
  const { data, isLoading, error } = useQuery<Permission[], AxiosError>({
    queryKey: [PermissionsQueryKey],
    queryFn: getPermissions,
  });
  return { permissions: data ?? [], isLoading, fetchError: error };
};
