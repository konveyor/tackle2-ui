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
  const { isLoading, mutate, mutateAsync, error } = useMutation({
    mutationFn: updateIdentity,
    onSuccess: (_, identity) => {
      queryClient.invalidateQueries([IdentitiesQueryKey]);
      onSuccess?.(identity);
    },
    onError,
  });
  return {
    mutate,
    mutateAsync,
    isLoading,
    error,
  };
};

export const useCreateIdentityMutation = (
  onSuccess: (identity: Identity, identityToCreate: New<Identity>) => void,
  onError: (err: AxiosError, identityToCreate: New<Identity>) => void
) => {
  const queryClient = useQueryClient();
  const { isLoading, mutate, error } = useMutation({
    mutationFn: createIdentity,
    onSuccess: (data, identityToCreate) => {
      queryClient.invalidateQueries([IdentitiesQueryKey]);
      onSuccess(data, identityToCreate);
    },
    onError,
  });
  return {
    mutate,
    isLoading,
    error,
  };
};

export const useFetchIdentities = (refetchInterval: number | false = false) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [IdentitiesQueryKey],
    queryFn: getIdentities,
    onError: (error) => console.log("error, ", error),
    refetchInterval,
  });
  return {
    identities: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useDeleteIdentityMutation = (
  onSuccess: (identity: Identity) => void,
  onError: (err: AxiosError, identity: Identity) => void
) => {
  const queryClient = useQueryClient();

  const { isLoading, mutate, error } = useMutation({
    mutationFn: deleteIdentity,
    onSuccess: (_, identity) => {
      queryClient.invalidateQueries([IdentitiesQueryKey]);
      onSuccess(identity);
    },
    onError: (err: AxiosError, identity) => {
      queryClient.invalidateQueries([IdentitiesQueryKey]);
      onError(err, identity);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};
