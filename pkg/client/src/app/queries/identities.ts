import { useMutation, useQuery, useQueryClient } from "react-query";

import {
  createIdentity,
  deleteIdentity,
  getIdentities,
  updateIdentity,
} from "@app/api/rest";
import { Identity } from "@app/api/models";
import { AxiosError } from "axios";

export interface IIdentityFetchState {
  identities: Identity[];
  isFetching: boolean;
  fetchError: any;
}

export const IdentitiesQueryKey = "identities";

export const useUpdateIdentityMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isLoading, mutate, error } = useMutation(updateIdentity, {
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries("identities");
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
  const { isLoading, mutate, error } = useMutation(createIdentity, {
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries("identities");
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

export const useFetchIdentities = (): IIdentityFetchState => {
  const { data, isLoading, error } = useQuery(
    IdentitiesQueryKey,
    async () => (await getIdentities()).data,
    {
      onError: (error) => console.log("error, ", error),
    }
  );
  return {
    identities: data || [],
    isFetching: isLoading,
    fetchError: error,
  };
};

export const useDeleteIdentityMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  const { isLoading, mutate, error } = useMutation(deleteIdentity, {
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries("identities");
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries("identities");
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};
