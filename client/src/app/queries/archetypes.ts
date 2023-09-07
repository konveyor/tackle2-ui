import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AxiosError } from "axios";
import { Archetype } from "@app/api/models";
import {
  createArchetype,
  deleteArchetype,
  getArchetypeById,
  getArchetypes,
  updateArchetype,
} from "@app/api/rest";

export const ARCHETYPES_QUERY_KEY = "archetypes";
export const ARCHETYPE_QUERY_KEY = "archetype";

export const useFetchArchetypes = () => {
  const { isLoading, error, refetch, data } = useQuery({
    initialData: [],
    queryKey: [ARCHETYPES_QUERY_KEY],
    queryFn: getArchetypes,
    refetchInterval: 5000,
    onError: (error: AxiosError) => console.log(error),
  });

  return {
    archetypes: data || [],
    isFetching: isLoading,
    error,
    refetch,
  };
};

export const useFetchArchetypeById = (id: number) => {
  const { data, isLoading, error } = useQuery({
    queryKey: [ARCHETYPE_QUERY_KEY, id],
    queryFn: () => getArchetypeById(id),
    onError: (error: AxiosError) => console.log("error, ", error),
  });

  return {
    archetype: data,
    isFetching: isLoading,
    fetchError: error,
  };
};

export const useCreateArchetypeMutation = (
  onSuccess: (archetype: Archetype) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createArchetype,
    onSuccess: (archetype) => {
      onSuccess(archetype);
      queryClient.invalidateQueries([ARCHETYPES_QUERY_KEY]);
    },
    onError: onError,
  });
};

export const useUpdateArchetypeMutation = (
  onSuccess: (id: number) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateArchetype,
    onSuccess: (_, { id }) => {
      onSuccess(id);
      queryClient.invalidateQueries([ARCHETYPES_QUERY_KEY]);
      queryClient.invalidateQueries([ARCHETYPE_QUERY_KEY, id]);
    },
    onError: onError,
  });
};

export const useDeleteArchetypeMutation = (
  onSuccess: (archetype: Archetype) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (archetype: Archetype) => deleteArchetype(archetype.id),
    onSuccess: (_, archetype) => {
      onSuccess(archetype);
      queryClient.invalidateQueries([ARCHETYPES_QUERY_KEY]);
      queryClient.invalidateQueries([ARCHETYPE_QUERY_KEY, archetype.id]);
    },
    onError: onError,
  });
};
