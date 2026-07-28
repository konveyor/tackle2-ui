import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import type {
  AgentPlaybook,
  AgentPlaybookSpec,
  AgentResource,
  AgentResourceSpec,
  AgentRun,
  LLMProvider,
  SkillCard,
  SkillCardSpec,
  SkillCollection,
  SkillCollectionSpec
} from "@app/api/agentic/contract";
import {
  createAgent,
  createAgentRun,
  createPlaybook,
  createSkillCard,
  createSkillCollection,
  deleteAgent,
  deleteAgentRun,
  deletePlaybook,
  deleteSkillCard,
  deleteSkillCollection,
  getAgentRun,
  getAgentRuns,
  getAgents,
  getImagesWithSource,
  getPlaybooks,
  getProviders,
  getSkillCards,
  getSkillCollections,
  updateAgent,
  updatePlaybook,
  updateSkillCard,
  updateSkillCollection,
} from "@app/api/rest";

export const AGENT_RUNS_QUERY_KEY = "agentRuns";
export const AGENT_RUN_QUERY_KEY = "agentRun";
export const AGENTS_QUERY_KEY = "agents";
export const SKILL_CARDS_QUERY_KEY = "skillCards";
export const SKILL_COLLECTIONS_QUERY_KEY = "skillCollections";
export const PROVIDERS_QUERY_KEY = "llmProviders";
export const PLAYBOOKS_QUERY_KEY = "playbooks";
export const IMAGES_QUERY_KEY = "agentImages";

export const useFetchAgentRuns = (refetchInterval: number | false = 2000) => {
  const { isLoading, error, data, refetch } = useQuery({
    queryKey: [AGENT_RUNS_QUERY_KEY],
    queryFn: getAgentRuns,
    onError: (error: AxiosError) => console.log(error),
    refetchInterval,
  });

  return {
    agentRuns: data || [],
    isLoading,
    fetchError: error,
    refetch,
  };
};

export const useFetchAgentRun = (
  name: string,
  refetchInterval: number | false = 2000
) => {
  const { isLoading, error, data } = useQuery({
    queryKey: [AGENT_RUN_QUERY_KEY, name],
    queryFn: () => getAgentRun(name),
    onError: (error: AxiosError) => console.log(error),
    refetchInterval,
    enabled: !!name,
  });

  return {
    agentRun: data,
    isLoading,
    fetchError: error,
  };
};

export const useFetchAgents = () => {
  const { isLoading, error, data, refetch } = useQuery({
    queryKey: [AGENTS_QUERY_KEY],
    queryFn: getAgents,
    onError: (error: AxiosError) => console.log(error),
  });

  return {
    agents: data || [],
    isLoading,
    fetchError: error,
    refetch,
  };
};

export const useCreateAgentRunMutation = (
  onSuccess: (run: AgentRun) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAgentRun,
    onSuccess: (data) => {
      onSuccess(data);
      queryClient.invalidateQueries({ queryKey: [AGENT_RUNS_QUERY_KEY] });
    },
    onError,
  });
};

export const useDeleteAgentRunMutation = (
  onSuccess: (name: string) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => deleteAgentRun(name),
    onSuccess: (_, name) => {
      onSuccess(name);
      queryClient.invalidateQueries({ queryKey: [AGENT_RUNS_QUERY_KEY] });
    },
    onError,
  });
};

// -------------------------------------------------------- Skill Cards

export const useFetchSkillCards = (refetchInterval: number | false = 2000) => {
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, spec }: { name: string; spec: SkillCardSpec }) =>
      createSkillCard(name, spec),
    onSuccess: (data) => {
      onSuccess(data);
      qc.invalidateQueries({ queryKey: [SKILL_CARDS_QUERY_KEY] });
    },
    onError,
  });
};

export const useUpdateSkillCardMutation = (
  onSuccess: (sc: SkillCard) => void,
  onError: (err: AxiosError) => void
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, spec }: { name: string; spec: SkillCardSpec }) =>
      updateSkillCard(name, spec),
    onSuccess: (data) => {
      onSuccess(data);
      qc.invalidateQueries({ queryKey: [SKILL_CARDS_QUERY_KEY] });
    },
    onError,
  });
};

export const useDeleteSkillCardMutation = (
  onSuccess: (name: string) => void,
  onError: (err: AxiosError) => void
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => deleteSkillCard(name),
    onSuccess: (_, name) => {
      onSuccess(name);
      qc.invalidateQueries({ queryKey: [SKILL_CARDS_QUERY_KEY] });
    },
    onError,
  });
};

// ------------------------------------------------- Skill Collections

export const useFetchSkillCollections = (
  refetchInterval: number | false = 2000
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, spec }: { name: string; spec: SkillCollectionSpec }) =>
      createSkillCollection(name, spec),
    onSuccess: (data) => {
      onSuccess(data);
      qc.invalidateQueries({ queryKey: [SKILL_COLLECTIONS_QUERY_KEY] });
    },
    onError,
  });
};

export const useUpdateSkillCollectionMutation = (
  onSuccess: (sc: SkillCollection) => void,
  onError: (err: AxiosError) => void
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, spec }: { name: string; spec: SkillCollectionSpec }) =>
      updateSkillCollection(name, spec),
    onSuccess: (data) => {
      onSuccess(data);
      qc.invalidateQueries({ queryKey: [SKILL_COLLECTIONS_QUERY_KEY] });
    },
    onError,
  });
};

export const useDeleteSkillCollectionMutation = (
  onSuccess: (name: string) => void,
  onError: (err: AxiosError) => void
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => deleteSkillCollection(name),
    onSuccess: (_, name) => {
      onSuccess(name);
      qc.invalidateQueries({ queryKey: [SKILL_COLLECTIONS_QUERY_KEY] });
    },
    onError,
  });
};

// --------------------------------------------------------- Providers

export const useFetchProviders = () => {
  const { isLoading, error, data, refetch } = useQuery({
    queryKey: [PROVIDERS_QUERY_KEY],
    queryFn: getProviders,
    onError: (error: AxiosError) => console.log(error),
  });
  return { providers: data || [], isLoading, fetchError: error, refetch };
};

// --------------------------------------------------------- Playbooks

export const useFetchPlaybooks = (refetchInterval: number | false = 2000) => {
  const { isLoading, error, data, refetch } = useQuery({
    queryKey: [PLAYBOOKS_QUERY_KEY],
    queryFn: getPlaybooks,
    onError: (error: AxiosError) => console.log(error),
    refetchInterval,
  });
  return { playbooks: data || [], isLoading, fetchError: error, refetch };
};

export const useCreatePlaybookMutation = (
  onSuccess: (pb: AgentPlaybook) => void,
  onError: (err: AxiosError) => void
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, spec }: { name: string; spec: AgentPlaybookSpec }) =>
      createPlaybook(name, spec),
    onSuccess: (data) => {
      onSuccess(data);
      qc.invalidateQueries({ queryKey: [PLAYBOOKS_QUERY_KEY] });
    },
    onError,
  });
};

export const useUpdatePlaybookMutation = (
  onSuccess: (pb: AgentPlaybook) => void,
  onError: (err: AxiosError) => void
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, spec }: { name: string; spec: AgentPlaybookSpec }) =>
      updatePlaybook(name, spec),
    onSuccess: (data) => {
      onSuccess(data);
      qc.invalidateQueries({ queryKey: [PLAYBOOKS_QUERY_KEY] });
    },
    onError,
  });
};

export const useDeletePlaybookMutation = (
  onSuccess: (name: string) => void,
  onError: (err: AxiosError) => void
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => deletePlaybook(name),
    onSuccess: (_, name) => {
      onSuccess(name);
      qc.invalidateQueries({ queryKey: [PLAYBOOKS_QUERY_KEY] });
    },
    onError,
  });
};

// ---------------------------------------------------- Agent mutations

export const useCreateAgentMutation = (
  onSuccess: (a: AgentResource) => void,
  onError: (err: AxiosError) => void
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, spec }: { name: string; spec: AgentResourceSpec }) =>
      createAgent(name, spec),
    onSuccess: (data) => {
      onSuccess(data);
      qc.invalidateQueries({ queryKey: [AGENTS_QUERY_KEY] });
    },
    onError,
  });
};

export const useUpdateAgentMutation = (
  onSuccess: (a: AgentResource) => void,
  onError: (err: AxiosError) => void
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, spec }: { name: string; spec: AgentResourceSpec }) =>
      updateAgent(name, spec),
    onSuccess: (data) => {
      onSuccess(data);
      qc.invalidateQueries({ queryKey: [AGENTS_QUERY_KEY] });
    },
    onError,
  });
};

export const useDeleteAgentMutation = (
  onSuccess: (name: string) => void,
  onError: (err: AxiosError) => void
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => deleteAgent(name),
    onSuccess: (_, name) => {
      onSuccess(name);
      qc.invalidateQueries({ queryKey: [AGENTS_QUERY_KEY] });
    },
    onError,
  });
};

// ----------------------------------------------------------- Images

export const useFetchImagesWithSource = () => {
  const { isLoading, error, data } = useQuery({
    queryKey: [IMAGES_QUERY_KEY],
    queryFn: getImagesWithSource,
    onError: (error: AxiosError) => console.log(error),
  });
  return {
    images: data?.images || [],
    source: data?.source ?? null,
    isLoading,
    fetchError: error,
  };
};
