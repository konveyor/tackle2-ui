import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createIdentity,
  deleteIdentity,
  getIdentities,
  updateIdentity,
} from "@app/api/rest";
import { AxiosError } from "axios";
import { Identity } from "@app/api/models";

export const IdentitiesQueryKey = "identities";

export const useUpdateIdentityMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isLoading, mutate, error } = useMutation({
    mutationFn: updateIdentity,
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([IdentitiesQueryKey]);
    },
    onError: (err: AxiosError) => {
      onError(err);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};

export const useCreateIdentityMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isLoading, mutate, error } = useMutation({
    mutationFn: createIdentity,
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([IdentitiesQueryKey]);
    },
    onError: (err: AxiosError) => {
      onError(err);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};

export const useFetchIdentities = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [IdentitiesQueryKey],
    queryFn: async () => (await getIdentities()).data,
    onError: (error) => console.log("error, ", error),
  });
  return {
    identities: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useDeleteIdentityMutation = (
  onSuccess: (identityName: string) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  const { isLoading, mutate, error } = useMutation({
    mutationFn: ({ identity }: { identity: Identity }) =>
      deleteIdentity(identity),
    onSuccess: (_, vars) => {
      onSuccess(vars.identity.name);
      queryClient.invalidateQueries([IdentitiesQueryKey]);
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries([IdentitiesQueryKey]);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};
