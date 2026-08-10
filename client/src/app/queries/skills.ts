import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import type {
  SkillCard,
  SkillCardSpec,
  SkillCollection,
  SkillCollectionSpec,
} from "@app/api/agentic/contract";
import {
  createSkillCard,
  createSkillCollection,
  deleteSkillCard,
  deleteSkillCollection,
  getSkillCards,
  getSkillCollections,
  updateSkillCard,
  updateSkillCollection,
} from "@app/api/rest";

export const SKILL_CARDS_QUERY_KEY = "skillCards";
export const SKILL_COLLECTIONS_QUERY_KEY = "skillCollections";

// -------------------------------------------------------- Skill Cards

export const useFetchSkillCards = (
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { isLoading, error, data, refetch } = useQuery({
    queryKey: [SKILL_CARDS_QUERY_KEY],
    queryFn: getSkillCards,
    onError: (error: AxiosError) => console.log(error),
    refetchInterval,
  });
  return { skillCards: data || [], isLoading, fetchError: error, refetch };
};

export const useCreateSkillCardMutation = (
  onSuccess: (sc: SkillCard) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, spec }: { name: string; spec: SkillCardSpec }) =>
      createSkillCard(name, spec),
    onSuccess: (data) => {
      onSuccess(data);
      queryClient.invalidateQueries({ queryKey: [SKILL_CARDS_QUERY_KEY] });
    },
    onError,
  });
};

export const useUpdateSkillCardMutation = (
  onSuccess: () => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, spec }: { name: string; spec: SkillCardSpec }) =>
      updateSkillCard(name, spec),
    onSuccess: () => {
      onSuccess();
      queryClient.invalidateQueries({ queryKey: [SKILL_CARDS_QUERY_KEY] });
    },
    onError,
  });
};

export const useDeleteSkillCardMutation = (
  onSuccess: (name: string) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => deleteSkillCard(name),
    onSuccess: (_, name) => {
      onSuccess(name);
      queryClient.invalidateQueries({ queryKey: [SKILL_CARDS_QUERY_KEY] });
    },
    onError,
  });
};

// ------------------------------------------------- Skill Collections

export const useFetchSkillCollections = (
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { isLoading, error, data, refetch } = useQuery({
    queryKey: [SKILL_COLLECTIONS_QUERY_KEY],
    queryFn: getSkillCollections,
    onError: (error: AxiosError) => console.log(error),
    refetchInterval,
  });
  return {
    skillCollections: data || [],
    isLoading,
    fetchError: error,
    refetch,
  };
};

export const useCreateSkillCollectionMutation = (
  onSuccess: (sc: SkillCollection) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, spec }: { name: string; spec: SkillCollectionSpec }) =>
      createSkillCollection(name, spec),
    onSuccess: (data) => {
      onSuccess(data);
      queryClient.invalidateQueries({
        queryKey: [SKILL_COLLECTIONS_QUERY_KEY],
      });
    },
    onError,
  });
};

export const useUpdateSkillCollectionMutation = (
  onSuccess: () => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, spec }: { name: string; spec: SkillCollectionSpec }) =>
      updateSkillCollection(name, spec),
    onSuccess: () => {
      onSuccess();
      queryClient.invalidateQueries({
        queryKey: [SKILL_COLLECTIONS_QUERY_KEY],
      });
    },
    onError,
  });
};

export const useDeleteSkillCollectionMutation = (
  onSuccess: (name: string) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => deleteSkillCollection(name),
    onSuccess: (_, name) => {
      onSuccess(name);
      queryClient.invalidateQueries({
        queryKey: [SKILL_COLLECTIONS_QUERY_KEY],
      });
    },
    onError,
  });
};
