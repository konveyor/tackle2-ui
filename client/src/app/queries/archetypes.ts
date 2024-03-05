import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AxiosError } from "axios";
import { Application, Archetype } from "@app/api/models";
import {
  createArchetype,
  deleteArchetype,
  getArchetypeById,
  getArchetypes,
  updateArchetype,
} from "@app/api/rest";
import { assessmentsByItemIdQueryKey } from "./assessments";
import { useState } from "react";

export const ARCHETYPES_QUERY_KEY = "archetypes";
export const ARCHETYPE_QUERY_KEY = "archetype";

export const useFetchArchetypes = (forApplication?: Application | null) => {
  const [filteredArchetypes, setFilteredArchetypes] = useState<Archetype[]>([]);

  const queryClient = useQueryClient();
  const { isLoading, isSuccess, error, refetch, data } = useQuery({
    initialData: [],
    queryKey: [ARCHETYPES_QUERY_KEY, forApplication?.id],
    queryFn: getArchetypes,
    onSuccess: (fetchedArchetypes) => {
      if (!forApplication) {
        setFilteredArchetypes(fetchedArchetypes);
      } else if (Array.isArray(forApplication.archetypes)) {
        const archetypeIds = forApplication.archetypes.map(
          (archetype) => archetype.id
        );
        const filtered = fetchedArchetypes.filter((archetype) =>
          archetypeIds.includes(archetype.id)
        );
        setFilteredArchetypes(filtered);
      } else {
        setFilteredArchetypes([]);
      }

      queryClient.invalidateQueries([assessmentsByItemIdQueryKey]);
    },
    onError: (error: AxiosError) => console.log(error),
  });

  return {
    archetypes: filteredArchetypes,
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
