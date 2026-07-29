import axios from "axios";

import type {
  AgentImage,
  AgentPlaybook,
  AgentPlaybookRun,
  AgentPlaybookSpec,
  AgentResource,
  AgentResourceSpec,
  AgentRun,
  AgenticApplication,
  CreatePlaybookRunInput,
  CreateRunInput,
  LLMProvider,
  SeedResult,
  SkillCard,
  SkillCardSpec,
  SkillCollection,
  SkillCollectionSpec,
} from "../agentic/contract";
import { prefixedUrlTag } from "../rest";

const agentic = prefixedUrlTag("/agentic");

const AGENT_RUNS = agentic`/agentruns`;
const AGENTS = agentic`/agents`;
const APPLICATIONS = agentic`/applications`;
const SKILL_CARDS = agentic`/skillcards`;
const SKILL_COLLECTIONS = agentic`/skillcollections`;
const LLM_PROVIDERS = agentic`/llmproviders`;
const PLAYBOOKS = agentic`/agentplaybooks`;
const PLAYBOOK_RUNS = agentic`/agentplaybookruns`;
const IMAGES = agentic`/images`;
const DEFAULTS = agentic`/defaults`;

export const getAgentRuns = (): Promise<AgentRun[]> =>
  axios.get<AgentRun[]>(AGENT_RUNS).then(({ data }) => data);

export const getAgentRun = (name: string): Promise<AgentRun> =>
  axios
    .get<AgentRun>(`${AGENT_RUNS}/${encodeURIComponent(name)}`)
    .then(({ data }) => data);

export const createAgentRun = (input: CreateRunInput): Promise<AgentRun> =>
  axios.post<AgentRun>(AGENT_RUNS, input).then(({ data }) => data);

export const deleteAgentRun = (name: string): Promise<void> =>
  axios
    .delete(`${AGENT_RUNS}/${encodeURIComponent(name)}`)
    .then(() => undefined);

export const getAgents = (): Promise<AgentResource[]> =>
  axios.get<AgentResource[]>(AGENTS).then(({ data }) => data);

export interface ApplicationsWithSource {
  source: "hub" | "stub" | "unknown";
  endpoint: string;
  applications: AgenticApplication[];
}

export const getApplicationsWithSource = (): Promise<ApplicationsWithSource> =>
  axios.get<AgenticApplication[]>(APPLICATIONS).then(({ data, headers }) => ({
    source: (headers["x-inventory-source"] as "hub" | "stub") ?? "unknown",
    endpoint: (headers["x-inventory-endpoint"] as string) ?? "",
    applications: data,
  }));

export const getAgenticAcpUrl = (runName: string): string => {
  const { protocol, host } = window.location;
  const wsProto = protocol === "https:" ? "wss:" : "ws:";
  return `${wsProto}//${host}/agentic/agentruns/${encodeURIComponent(runName)}/acp`;
};

// ---------------------------------------------------------- Agents (CRUD)

export const getAgent = (name: string): Promise<AgentResource> =>
  axios
    .get<AgentResource>(`${AGENTS}/${encodeURIComponent(name)}`)
    .then(({ data }) => data);

export const createAgent = (
  name: string,
  spec: AgentResourceSpec
): Promise<AgentResource> =>
  axios.post<AgentResource>(AGENTS, { name, spec }).then(({ data }) => data);

export const updateAgent = (
  name: string,
  spec: AgentResourceSpec
): Promise<AgentResource> =>
  axios
    .put<AgentResource>(`${AGENTS}/${encodeURIComponent(name)}`, { spec })
    .then(({ data }) => data);

export const deleteAgent = (name: string): Promise<void> =>
  axios.delete(`${AGENTS}/${encodeURIComponent(name)}`).then(() => undefined);

// ------------------------------------------------------- Skill Cards (CRUD)

export const getSkillCards = (): Promise<SkillCard[]> =>
  axios.get<SkillCard[]>(SKILL_CARDS).then(({ data }) => data);

export const getSkillCard = (name: string): Promise<SkillCard> =>
  axios
    .get<SkillCard>(`${SKILL_CARDS}/${encodeURIComponent(name)}`)
    .then(({ data }) => data);

export const createSkillCard = (
  name: string,
  spec: SkillCardSpec
): Promise<SkillCard> =>
  axios.post<SkillCard>(SKILL_CARDS, { name, spec }).then(({ data }) => data);

export const updateSkillCard = (
  name: string,
  spec: SkillCardSpec
): Promise<SkillCard> =>
  axios
    .put<SkillCard>(`${SKILL_CARDS}/${encodeURIComponent(name)}`, { spec })
    .then(({ data }) => data);

export const deleteSkillCard = (name: string): Promise<void> =>
  axios
    .delete(`${SKILL_CARDS}/${encodeURIComponent(name)}`)
    .then(() => undefined);

// -------------------------------------------------- Skill Collections (CRUD)

export const getSkillCollections = (): Promise<SkillCollection[]> =>
  axios.get<SkillCollection[]>(SKILL_COLLECTIONS).then(({ data }) => data);

export const getSkillCollection = (name: string): Promise<SkillCollection> =>
  axios
    .get<SkillCollection>(`${SKILL_COLLECTIONS}/${encodeURIComponent(name)}`)
    .then(({ data }) => data);

export const createSkillCollection = (
  name: string,
  spec: SkillCollectionSpec
): Promise<SkillCollection> =>
  axios
    .post<SkillCollection>(SKILL_COLLECTIONS, { name, spec })
    .then(({ data }) => data);

export const updateSkillCollection = (
  name: string,
  spec: SkillCollectionSpec
): Promise<SkillCollection> =>
  axios
    .put<SkillCollection>(`${SKILL_COLLECTIONS}/${encodeURIComponent(name)}`, {
      spec,
    })
    .then(({ data }) => data);

export const deleteSkillCollection = (name: string): Promise<void> =>
  axios
    .delete(`${SKILL_COLLECTIONS}/${encodeURIComponent(name)}`)
    .then(() => undefined);

// -------------------------------------------------------- LLM Providers (read)

export const getProviders = (): Promise<LLMProvider[]> =>
  axios.get<LLMProvider[]>(LLM_PROVIDERS).then(({ data }) => data);

export const getProvider = (name: string): Promise<LLMProvider> =>
  axios
    .get<LLMProvider>(`${LLM_PROVIDERS}/${encodeURIComponent(name)}`)
    .then(({ data }) => data);

// --------------------------------------------------------- Playbooks (CRUD)

export const getPlaybooks = (): Promise<AgentPlaybook[]> =>
  axios.get<AgentPlaybook[]>(PLAYBOOKS).then(({ data }) => data);

export const getPlaybook = (name: string): Promise<AgentPlaybook> =>
  axios
    .get<AgentPlaybook>(`${PLAYBOOKS}/${encodeURIComponent(name)}`)
    .then(({ data }) => data);

export const createPlaybook = (
  name: string,
  spec: AgentPlaybookSpec
): Promise<AgentPlaybook> =>
  axios.post<AgentPlaybook>(PLAYBOOKS, { name, spec }).then(({ data }) => data);

export const updatePlaybook = (
  name: string,
  spec: AgentPlaybookSpec
): Promise<AgentPlaybook> =>
  axios
    .put<AgentPlaybook>(`${PLAYBOOKS}/${encodeURIComponent(name)}`, { spec })
    .then(({ data }) => data);

export const deletePlaybook = (name: string): Promise<void> =>
  axios
    .delete(`${PLAYBOOKS}/${encodeURIComponent(name)}`)
    .then(() => undefined);

// ----------------------------------------------------- Playbook Runs (CRUD)

export const getPlaybookRuns = (): Promise<AgentPlaybookRun[]> =>
  axios.get<AgentPlaybookRun[]>(PLAYBOOK_RUNS).then(({ data }) => data);

export const getPlaybookRun = (name: string): Promise<AgentPlaybookRun> =>
  axios
    .get<AgentPlaybookRun>(`${PLAYBOOK_RUNS}/${encodeURIComponent(name)}`)
    .then(({ data }) => data);

export const createPlaybookRun = (
  input: CreatePlaybookRunInput
): Promise<AgentPlaybookRun> =>
  axios.post<AgentPlaybookRun>(PLAYBOOK_RUNS, input).then(({ data }) => data);

export const deletePlaybookRun = (name: string): Promise<void> =>
  axios
    .delete(`${PLAYBOOK_RUNS}/${encodeURIComponent(name)}`)
    .then(() => undefined);

// ----------------------------------------------------------- Images (read)

export interface ImagesWithSource {
  source: "configmap" | "builtin";
  images: AgentImage[];
}

export const getImagesWithSource = (): Promise<ImagesWithSource> =>
  axios.get<AgentImage[]>(IMAGES).then(({ data, headers }) => ({
    source:
      (headers["x-catalog-source"] as "configmap" | "builtin") ?? "builtin",
    images: data,
  }));

// -------------------------------------------------------- Seeded defaults

/**
 * Seed the managed default resource set. Idempotent create-only: existing
 * resources are reported as "exists", never updated.
 */
export const loadDefaults = (): Promise<SeedResult[]> =>
  axios.post<SeedResult[]>(DEFAULTS).then(({ data }) => data);
