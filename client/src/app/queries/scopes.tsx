import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { Scope } from "@app/api/models";
import { getScopes } from "@app/api/rest/scopes";

export const ScopesQueryKey = "scopes";

export const useFetchScopes = () => {
  const { data, isLoading, error } = useQuery<Scope[], AxiosError>({
    queryKey: [ScopesQueryKey],
    queryFn: getScopes,
  });
  return { scopes: data ?? [], isLoading, fetchError: error };
};
