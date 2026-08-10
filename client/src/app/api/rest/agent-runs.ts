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
import { APPLICATION_LABEL } from "../agentic/contract";
import { prefixedUrlTag } from "../rest";

// `agentic` and the three constants below it stay pointed at the old
// `/agentic` shim surface for this task — Tasks 5-7 remove them with their
// consumers (Images catalog, Load-defaults, applications inventory list).
// Repointing them at `/hub/agent` now would be wrong: those kinds have no
// equivalent there. They compile, and their features visibly break against
// the mock until then (expected).
const agentic = prefixedUrlTag("/agentic");
const APPLICATIONS = agentic`/applications`;
const IMAGES = agentic`/images`;
const DEFAULTS = agentic`/defaults`;

const hubAgent = prefixedUrlTag("/hub/agent");

const AGENT_RUNS = hubAgent`/runs`;
const AGENTS = hubAgent`/agents`;
const SKILL_CARDS = hubAgent`/skills`;
const SKILL_COLLECTIONS = hubAgent`/skillcollections`;
const GATEWAYS = hubAgent`/gateways`;
const WORKFLOWS = hubAgent`/workflows`;
const WORKFLOW_RUNS = hubAgent`/workflowruns`;

export const getAgentRuns = (): Promise<AgentRun[]> =>
  axios.get<AgentRun[]>(AGENT_RUNS).then(({ data }) => data);

export const getAgentRun = (name: string): Promise<AgentRun> =>
  axios
    .get<AgentRun>(`${AGENT_RUNS}/${encodeURIComponent(name)}`)
    .then(({ data }) => data);

const paramList = (params?: Record<string, string>) =>
  params && Object.keys(params).length > 0
    ? Object.entries(params).map(([name, value]) => ({ name, value }))
    : undefined;

const runMetadata = (applicationRef?: string) => ({
  generateName: "ui-",
  ...(applicationRef
    ? { labels: { [APPLICATION_LABEL]: applicationRef } }
    : {}),
});

export const createAgentRun = (input: CreateRunInput): Promise<AgentRun> =>
  axios
    .post<AgentRun>(AGENT_RUNS, {
      metadata: runMetadata(input.applicationRef),
      spec: {
        agentRef: input.agentRef,
        ...(paramList(input.params) ? { params: paramList(input.params) } : {}),
        ...(input.instructions !== undefined
          ? { instructions: input.instructions }
          : {}),
        ...(input.gateway ? { gateway: input.gateway } : {}),
      },
    })
    .then(({ data }) => data);

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
  return `${wsProto}//${host}/hub/agent/runs/${encodeURIComponent(runName)}/acp`;
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
  axios
    .post<AgentResource>(AGENTS, { metadata: { name }, spec })
    .then(({ data }) => data);

export const updateAgent = (
  name: string,
  spec: AgentResourceSpec
): Promise<void> =>
  axios
    .put(`${AGENTS}/${encodeURIComponent(name)}`, { metadata: { name }, spec })
    .then(() => undefined);

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
  axios
    .post<SkillCard>(SKILL_CARDS, { metadata: { name }, spec })
    .then(({ data }) => data);

export const updateSkillCard = (
  name: string,
  spec: SkillCardSpec
): Promise<void> =>
  axios
    .put(`${SKILL_CARDS}/${encodeURIComponent(name)}`, {
      metadata: { name },
      spec,
    })
    .then(() => undefined);

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
    .post<SkillCollection>(SKILL_COLLECTIONS, { metadata: { name }, spec })
    .then(({ data }) => data);

export const updateSkillCollection = (
  name: string,
  spec: SkillCollectionSpec
): Promise<void> =>
  axios
    .put(`${SKILL_COLLECTIONS}/${encodeURIComponent(name)}`, {
      metadata: { name },
      spec,
    })
    .then(() => undefined);

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
  axios
    .post<AgentWorkflow>(WORKFLOWS, { metadata: { name }, spec })
    .then(({ data }) => data);

export const updateWorkflow = (
  name: string,
  spec: AgentWorkflowSpec
): Promise<void> =>
  axios
    .put(`${WORKFLOWS}/${encodeURIComponent(name)}`, {
      metadata: { name },
      spec,
    })
    .then(() => undefined);

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

// AgentWorkflowRun["spec"] in contract.ts has neither `targetBranch` nor
// `instructions` (only workflowRef/gateway/params/env/envFrom) — per the
// Step 2 rule both CreateWorkflowRunInput fields are dropped here, not just
// targetBranch. Neither reaches spec.env either; per design D3 that env
// injection (including target branch) is the hub's job, not the client's.
// No current caller populates `instructions` on this input (grep confirms
// useStartAgentWorkflowRuns.ts sets only workflowRef/applicationRef/
// targetBranch/params), so dropping it is a no-op today and a correctness
// fix against the real hub's CRD schema, which would reject unknown spec
// fields.
export const createWorkflowRun = (
  input: CreateWorkflowRunInput
): Promise<AgentWorkflowRun> =>
  axios
    .post<AgentWorkflowRun>(WORKFLOW_RUNS, {
      metadata: runMetadata(input.applicationRef),
      spec: {
        workflowRef: input.workflowRef,
        ...(paramList(input.params) ? { params: paramList(input.params) } : {}),
        ...(input.gateway ? { gateway: input.gateway } : {}),
      },
    })
    .then(({ data }) => data);

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
