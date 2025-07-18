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
import { assessmentsByItemIdQueryKey } from "./assessments";
import { useMemo } from "react";
import { objectify } from "radash";

export const ARCHETYPES_QUERY_KEY = "archetypes";
export const ARCHETYPE_QUERY_KEY = "archetype";

export const useFetchArchetypes = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isSuccess, error, refetch } = useQuery({
    queryKey: [ARCHETYPES_QUERY_KEY],
    queryFn: getArchetypes,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [assessmentsByItemIdQueryKey],
      });
    },
    onError: (error: AxiosError) => console.log(error),
  });

  const archetypesById = useMemo(() => {
    return !data ? {} : objectify(data, ({ id }) => id);
  }, [data]);

  return {
    archetypes: data,
    archetypesById,
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
      queryClient.invalidateQueries({ queryKey: [ARCHETYPES_QUERY_KEY] });
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
      queryClient.invalidateQueries({ queryKey: [ARCHETYPES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [ARCHETYPE_QUERY_KEY, id] });
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
      queryClient.invalidateQueries({ queryKey: [ARCHETYPES_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [ARCHETYPE_QUERY_KEY, archetype.id],
      });
    },
    onError: onError,
  });
};
