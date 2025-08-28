import { useMemo } from "react";
import { group } from "radash";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createIdentity,
  deleteIdentity,
  getIdentities,
  updateIdentity,
} from "@app/api/rest";
import { AxiosError } from "axios";
import { Identity, New } from "@app/api/models";

export const IdentitiesQueryKey = "identities";

export const useUpdateIdentityMutation = (
  onSuccess?: (identity: Identity) => void,
  onError?: (err: AxiosError, identity: Identity) => void
) => {
  const queryClient = useQueryClient();
  const { isPending, mutate, mutateAsync, error } = useMutation({
    mutationFn: updateIdentity,
    onSuccess: (_, identity) => {
      queryClient.invalidateQueries({ queryKey: [IdentitiesQueryKey] });
      onSuccess?.(identity);
    },
    onError,
  });
  return {
    mutate,
    mutateAsync,
    isPending,
    error,
  };
};

export const useCreateIdentityMutation = (
  onSuccess: (identity: Identity, identityToCreate: New<Identity>) => void,
  onError: (err: AxiosError, identityToCreate: New<Identity>) => void
) => {
  const queryClient = useQueryClient();
  const { isPending, mutate, error } = useMutation({
    mutationFn: createIdentity,
    onSuccess: (data, identityToCreate) => {
      queryClient.invalidateQueries({ queryKey: [IdentitiesQueryKey] });
      onSuccess(data, identityToCreate);
    },
    onError,
  });
  return {
    mutate,
    isPending,
    error,
  };
};

// TODO: Add a filter to the query to only return identities of given kind
export const useFetchIdentities = (refetchInterval: number | false = false) => {
  const { data, isLoading, isSuccess, error, refetch } = useQuery({
    queryKey: [IdentitiesQueryKey],
    queryFn: getIdentities,
    onError: (error) => console.log("error, ", error),
    refetchInterval,
  });

  const identitiesByKind = useMemo(() => {
    return data === undefined ? {} : group(data, (item) => item.kind);
  }, [data]);

  return {
    identities: data || [],
    identitiesByKind,
    isFetching: isLoading,
    isSuccess,
    fetchError: error,
    refetch,
  };
};

export const useDeleteIdentityMutation = (
  onSuccess: (identity: Identity) => void,
  onError: (err: AxiosError, identity: Identity) => void
) => {
  const queryClient = useQueryClient();

  const { isPending, mutate, error } = useMutation({
    mutationFn: deleteIdentity,
    onSuccess: (_, identity) => {
      queryClient.invalidateQueries({ queryKey: [IdentitiesQueryKey] });
      onSuccess(identity);
    },
    onError: (err: AxiosError, identity) => {
      queryClient.invalidateQueries({ queryKey: [IdentitiesQueryKey] });
      onError(err, identity);
    },
  });
  return {
    mutate,
    isPending,
    error,
  };
};
