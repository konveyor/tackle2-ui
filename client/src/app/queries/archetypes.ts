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
import {
  assessmentsQueryKey,
  assessmentsByItemIdQueryKey,
} from "./assessments";
import { reviewsQueryKey } from "./reviews";

export const ARCHETYPES_QUERY_KEY = "archetypes";
export const ARCHETYPE_QUERY_KEY = "archetype";

export const useFetchArchetypes = () => {
  const queryClient = useQueryClient();
  const { isLoading, isSuccess, error, refetch, data } = useQuery({
    initialData: [],
    queryKey: [ARCHETYPES_QUERY_KEY],
    queryFn: getArchetypes,
    refetchInterval: 5000,
    onSuccess: () => {
      queryClient.invalidateQueries([reviewsQueryKey]);
      queryClient.invalidateQueries([assessmentsQueryKey]);
      queryClient.invalidateQueries([assessmentsByItemIdQueryKey]);
    },

    onError: (error: AxiosError) => console.log(error),
  });

  return {
    archetypes: data || [],
    isFetching: isLoading,
    isSuccess,
    error,
    refetch,
  };
};

export const useFetchArchetypeById = (id?: number | string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: [ARCHETYPE_QUERY_KEY, id],
    queryFn: () =>
      id === undefined ? Promise.resolve(undefined) : getArchetypeById(id),
    onError: (error: AxiosError) => console.log("error, ", error),
    enabled: id !== undefined,
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
