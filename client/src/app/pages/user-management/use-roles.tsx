import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { getRoles } from "@app/api/rest";

import { Role } from "./types";

export const RolesQueryKey = "roles";

export const useFetchRoles = () => {
  const { data, isLoading, error } = useQuery<Role[], AxiosError>({
    queryKey: [RolesQueryKey],
    queryFn: getRoles,
  });

  return {
    roles: data ?? [],
    isFetching: isLoading,
    fetchError: error,
  };
};
