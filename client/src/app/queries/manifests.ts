import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AxiosError } from "axios";
import { Manifest } from "@app/api/models";
import {
  createManifest,
  deleteManifest,
  getManifestById,
  getManifests,
  updateManifest,
} from "@app/api/rest";

export const MANIFESTS_QUERY_KEY = "manifests";
export const MANIFEST_QUERY_KEY = "manifest";

export const useFetchManifests = () => {
  const { data, isLoading, isSuccess, error, refetch } = useQuery({
    queryKey: [MANIFESTS_QUERY_KEY],
    queryFn: getManifests,
    onError: (error: AxiosError) => console.log(error),
  });

  return {
    manifests: data,
    isFetching: isLoading,
    isSuccess,
    error,
    refetch,
  };
};

export const useFetchManifestById = (id?: number | string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: [MANIFEST_QUERY_KEY, id],
    queryFn: () =>
      id === undefined ? Promise.resolve(undefined) : getManifestById(id),
    onError: (error: AxiosError) => console.log("error, ", error),
    enabled: id !== undefined,
  });

  return {
    manifest: data,
    isFetching: isLoading,
    fetchError: error,
  };
};

export const useCreateManifestMutation = (
  onSuccess: (manifest: Manifest) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createManifest,
    onSuccess: (manifest) => {
      onSuccess(manifest);
      queryClient.invalidateQueries([MANIFESTS_QUERY_KEY]);
    },
    onError: onError,
  });
};

export const useUpdateManifestMutation = (
  onSuccess: (id: number) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateManifest,
    onSuccess: (_, { id }) => {
      onSuccess(id);
      queryClient.invalidateQueries([MANIFESTS_QUERY_KEY]);
      queryClient.invalidateQueries([MANIFEST_QUERY_KEY, id]);
    },
    onError: onError,
  });
};

export const useDeleteManifestMutation = (
  onSuccess: (manifest: Manifest) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (manifest: Manifest) => deleteManifest(manifest.id),
    onSuccess: (_, manifest) => {
      onSuccess(manifest);
      queryClient.invalidateQueries([MANIFESTS_QUERY_KEY]);
      queryClient.invalidateQueries([MANIFEST_QUERY_KEY, manifest.id]);
    },
    onError: onError,
  });
};
