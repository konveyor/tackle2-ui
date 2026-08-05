import axios from "axios";

import type {
  AgentImage,
  AgentResource,
  AgentResourceSpec,
  AgentRun,
  AgentWorkflow,
  AgentWorkflowRun,
  AgentWorkflowSpec,
  AgenticApplication,
  CreateRunInput,
  CreateWorkflowRunInput,
  Gateway,
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
const GATEWAYS = agentic`/gateways`;
const WORKFLOWS = agentic`/agentworkflows`;
const WORKFLOW_RUNS = agentic`/agentworkflowruns`;
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

// ------------------------------------------------------------ Gateways (read)

export const getGateways = (): Promise<Gateway[]> =>
  axios.get<Gateway[]>(GATEWAYS).then(({ data }) => data);

export const getGateway = (name: string): Promise<Gateway> =>
  axios
    .get<Gateway>(`${GATEWAYS}/${encodeURIComponent(name)}`)
    .then(({ data }) => data);

// --------------------------------------------------------- Workflows (CRUD)

export const getWorkflows = (): Promise<AgentWorkflow[]> =>
  axios.get<AgentWorkflow[]>(WORKFLOWS).then(({ data }) => data);

export const getWorkflow = (name: string): Promise<AgentWorkflow> =>
  axios
    .get<AgentWorkflow>(`${WORKFLOWS}/${encodeURIComponent(name)}`)
    .then(({ data }) => data);

export const createWorkflow = (
  name: string,
  spec: AgentWorkflowSpec
): Promise<AgentWorkflow> =>
  axios.post<AgentWorkflow>(WORKFLOWS, { name, spec }).then(({ data }) => data);

export const updateWorkflow = (
  name: string,
  spec: AgentWorkflowSpec
): Promise<AgentWorkflow> =>
  axios
    .put<AgentWorkflow>(`${WORKFLOWS}/${encodeURIComponent(name)}`, { spec })
    .then(({ data }) => data);

export const deleteWorkflow = (name: string): Promise<void> =>
  axios
    .delete(`${WORKFLOWS}/${encodeURIComponent(name)}`)
    .then(() => undefined);

// ----------------------------------------------------- Workflow Runs (CRUD)

export const getWorkflowRuns = (): Promise<AgentWorkflowRun[]> =>
  axios.get<AgentWorkflowRun[]>(WORKFLOW_RUNS).then(({ data }) => data);

export const getWorkflowRun = (name: string): Promise<AgentWorkflowRun> =>
  axios
    .get<AgentWorkflowRun>(`${WORKFLOW_RUNS}/${encodeURIComponent(name)}`)
    .then(({ data }) => data);

export const createWorkflowRun = (
  input: CreateWorkflowRunInput
): Promise<AgentWorkflowRun> =>
  axios.post<AgentWorkflowRun>(WORKFLOW_RUNS, input).then(({ data }) => data);

export const deleteWorkflowRun = (name: string): Promise<void> =>
  axios
    .delete(`${WORKFLOW_RUNS}/${encodeURIComponent(name)}`)
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
