/**
 * Contract types + helpers for the konveyor.io/v1alpha1 agent surface.
 *
 * Source of truth: github.com/konveyor/agentic-controller api/v1alpha1/*.go
 * (main @ 059b6f60 — post-#100 Gateway rename, post-#80 Workflow rename).
 * Browser-safe: no node builtins, no kube client.
 */

// ---------------------------------------------------------------- k8s meta

export interface ObjectMeta {
  name?: string;
  generateName?: string;
  namespace?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  uid?: string;
  resourceVersion?: string;
  creationTimestamp?: string;
}

export interface Condition {
  type: string;
  status: "True" | "False" | "Unknown";
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
  observedGeneration?: number;
}

// ---------------------------------------------------------------- env types

export interface EnvVar {
  name: string;
  value?: string;
  valueFrom?: unknown;
}

export interface EnvFromSource {
  configMapRef?: { name: string; optional?: boolean };
  secretRef?: { name: string; optional?: boolean };
  prefix?: string;
}

// ---------------------------------------------------------------- AgentRun

export type AgentRunPhase = "Pending" | "Running" | "Succeeded" | "Failed";

export interface AgentRunParam {
  name: string;
  value: string;
}

export interface AgentRunSpec {
  agentRef: string;
  params?: AgentRunParam[];
  instructions?: string;
  /**
   * Name of a Gateway from the Agent's gateways list. Optional when the
   * Agent declares exactly one gateway (the controller defaults to it);
   * required when it declares several (validation fails fast otherwise).
   */
  gateway?: string;
  env?: EnvVar[];
  envFrom?: EnvFromSource[];
}

/**
 * AgentRun condition reporting whether the agent's ACP endpoint accepts
 * connections (agentic-controller#160): True/Listening once the sandbox
 * pod passes its tcpSocket:4000 readiness probe, False/NotListening until
 * then, False/Finished once the run ends. Dial on this, not on phase.
 */
export const ACP_READY_CONDITION = "ACPReady";

export interface AgentRunStatus {
  phase?: AgentRunPhase;
  observedGeneration?: number;
  sandboxName?: string;
  startTime?: string;
  completionTime?: string;
  duration?: number;
  secretKeyRef?: { name: string };
  conditions?: Condition[];
}

export interface AgentRun {
  apiVersion?: string;
  kind?: string;
  metadata: ObjectMeta;
  spec: AgentRunSpec;
  status?: AgentRunStatus;
}

// ------------------------------------------------------------------- Agent

export type AgentParamType = "string" | "number" | "boolean";

export interface AgentParam {
  name: string;
  type?: AgentParamType;
  description?: string;
  default?: string;
  required?: boolean;
}

export interface AgentResourceSpec {
  image: string;
  prompt?: string;
  params?: AgentParam[];
  gateways?: { ref: string }[];
  skillCards?: { ref: string }[];
  skillCollections?: { ref: string }[];
}

export interface AgentResource {
  apiVersion?: string;
  kind?: string;
  metadata: ObjectMeta;
  spec: AgentResourceSpec;
  status?: { observedGeneration?: number; conditions?: Condition[] };
}

// ------------------------------------------------- platform-resolved params

/**
 * Label marking an agent as Konveyor-managed: its harness hard-requires
 * Hub context (HUB_BASE_URL / APP_ID / TARGET_BRANCH) at startup, so a
 * run created without an application crash-loops before its ACP endpoint
 * ever exists.
 */
export const MANAGED_LABEL = "konveyor.io/managed";

/** Stamped on runs at create so per-application views are a label selector. */
export const APPLICATION_LABEL = "konveyor.io/application";

export const PARAM_SOURCES_ANNOTATION = "konveyor.io/param-sources";
export const CREDENTIAL_SOURCES_ANNOTATION = "konveyor.io/credential-sources";
export const SOURCE_APPLICATION_REPOSITORY_URL =
  "konveyor.io/application-repository-url";
export const SOURCE_APPLICATION_REPOSITORY_BRANCH =
  "konveyor.io/application-repository-branch";
export const SOURCE_APPLICATION_IDENTITY = "konveyor.io/application-identity";

export function parseSourcesAnnotation(
  agent: Pick<AgentResource, "metadata"> | undefined,
  annotation: string = PARAM_SOURCES_ANNOTATION
): Record<string, string> {
  const raw = agent?.metadata?.annotations?.[annotation];
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
      return {};
    const out: Record<string, string> = {};
    for (const [name, source] of Object.entries(parsed)) {
      if (typeof source === "string" && source.trim() !== "")
        out[name] = source;
    }
    return out;
  } catch {
    return {};
  }
}

// ------------------------------------------------------ BUILTIN_AGENT_IMAGES

/**
 * The hub has no image-catalog endpoint, so the agent designer's image
 * field is free text. These are suggestions only (not validated against) —
 * the two agent images actually published by CI (.github/workflows/
 * build-images.yml) and pinned in the ROKS demo cluster's
 * agent-image-catalog ConfigMap override (deploy/roks/
 * agent-image-catalog.yaml). Any other image ref the user types is valid.
 */
export const BUILTIN_AGENT_IMAGES: string[] = [
  "ghcr.io/ibolton336/agent-base:demo",
  "ghcr.io/ibolton336/agent-java:demo",
];

// --------------------------------------------------------------- SkillCard

/**
 * Load policy. `skill` (default) is listed to the agent by name and
 * description and loaded on demand via `load_skill`; `rule` is injected
 * into every prompt of every Agent that references it (ADR 0014/0015).
 */
export type SkillCardType = "skill" | "rule";

/**
 * How the controller delivers a card's content to the sandbox, reported in
 * status post agentic-controller#157. Absent on older controllers.
 */
export type SkillDeliveryMode = "image" | "inline" | "source";

/**
 * One skill (an AgentSkills.io directory). Exactly one of `image`, `source`,
 * `inline` is set; every field is optional here so pre-#157 objects still
 * parse. Use `skillSourceKind()` from `@app/utils/skills` to pick the source.
 */
export interface SkillCardSpec {
  displayName?: string;
  description?: string;
  /** OCI image holding the skill (or several — then `subPath` selects one). */
  image?: string;
  /** Directory of the skill inside the image or repository. */
  subPath?: string;
  /** Git repository URL. */
  source?: string;
  /** Branch, tag or commit for `source`; unset clones the default branch on every run. */
  ref?: string;
  /** A single SKILL.md (YAML frontmatter + markdown), delivered as a ConfigMap. */
  inline?: string;
  tags?: string[];
  type?: SkillCardType;
  version?: string;
}

export interface SkillCard {
  apiVersion?: string;
  kind?: string;
  metadata: ObjectMeta;
  spec: SkillCardSpec;
  status?: {
    observedGeneration?: number;
    /** Image cards only. */
    resolvedImage?: string;
    deliveryMode?: SkillDeliveryMode;
    conditions?: Condition[];
  };
}

// --------------------------------------------------------- SkillCollection

/**
 * Label the controller stamps on SkillCards it creates while enumerating a
 * collection's `spec.image` (value = the collection name).
 */
export const SKILL_COLLECTION_LABEL = "konveyor.io/skillcollection";

/**
 * One explicit member: `name` plus exactly one of `skillCardRef` | `image` |
 * `source`. `ref`/`subPath`/`type` apply to image and source entries only —
 * a `skillCardRef` entry's `type` is ignored (the card carries its own).
 */
export interface SkillCollectionSkillRef {
  name: string;
  skillCardRef?: string;
  image?: string;
  source?: string;
  ref?: string;
  subPath?: string;
  type?: SkillCardType;
}

/**
 * Either an explicit `skills` list (≥ 1 entry) or, post-#157, an `image` the
 * controller enumerates into one owned SkillCard per skill found. The two are
 * mutually exclusive.
 */
export interface SkillCollectionSpec {
  version?: string;
  image?: string;
  /** Load policy applied to every skill enumerated from `image`. */
  type?: SkillCardType;
  skills?: SkillCollectionSkillRef[];
}

export interface SkillCollection {
  apiVersion?: string;
  kind?: string;
  metadata: ObjectMeta;
  spec: SkillCollectionSpec;
  status?: {
    observedGeneration?: number;
    conditions?: Condition[];
    /** Names of the SkillCards the collection resolves to (enumerate mode). */
    resolvedSkills?: string[];
  };
}

// ----------------------------------------------------------------- Gateway

export interface GatewayModel {
  name: string;
  contextWindow: number;
  tier?: string;
}

/** One Gateway = one provider/model endpoint (post-#100 shape). */
export interface Gateway {
  apiVersion?: string;
  kind?: string;
  metadata: ObjectMeta;
  spec: {
    /** Runtime provider id ("anthropic", "openai", "aws-bedrock", ...). */
    provider: string;
    endpoint: string;
    /** key absent = whole-Secret credential (e.g. AWS SigV4) via envFrom. */
    credentialRef: { secretName: string; key?: string };
    model: GatewayModel;
  };
  status?: {
    observedGeneration?: number;
    connectionVerified?: boolean;
    conditions?: Condition[];
  };
}

// ---------------------------------------------------------- AgentWorkflow

export const STAGE_NAME_PATTERN = /^[a-z]([a-z0-9-]*[a-z0-9])?$/;

export interface AgentWorkflowStage {
  name: string;
  agentRef: string;
  instructions?: string;
}

export interface AgentWorkflowSpec {
  guide?: string;
  stages: AgentWorkflowStage[];
}

export interface AgentWorkflow {
  apiVersion?: string;
  kind?: string;
  metadata: ObjectMeta;
  spec: AgentWorkflowSpec;
  status?: { observedGeneration?: number; conditions?: Condition[] };
}

// ------------------------------------------------------- AgentWorkflowRun

export type AgentWorkflowRunPhase =
  | "Pending"
  | "Running"
  | "Succeeded"
  | "Failed";

export interface AgentWorkflowRunStageStatus {
  name: string;
  phase?: AgentRunPhase;
  agentRunName?: string;
}

export interface AgentWorkflowRunStatus {
  phase?: AgentWorkflowRunPhase;
  observedGeneration?: number;
  currentStage?: string;
  stages?: AgentWorkflowRunStageStatus[];
  startTime?: string;
  completionTime?: string;
  conditions?: Condition[];
}

export interface AgentWorkflowRun {
  apiVersion?: string;
  kind?: string;
  metadata: ObjectMeta;
  spec: {
    workflowRef: string;
    /** Name of a Gateway, propagated to every stage's AgentRun. */
    gateway?: string;
    params?: AgentRunParam[];
    env?: EnvVar[];
    envFrom?: EnvFromSource[];
  };
  status?: AgentWorkflowRunStatus;
}

// -------------------------------------------------------- naming / helpers

export const RESOURCE_NAME_PATTERN = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/;

export const TARGET_BRANCH_PREFIX = "konveyor/migration-";

export function defaultTargetBranch(): string {
  return `${TARGET_BRANCH_PREFIX}${Math.floor(Date.now() / 1000)}`;
}

export function invalidTargetBranchReason(branch: string): string | undefined {
  if (!branch.trim()) return "Target branch is required";
  if (branch.includes("..")) return 'Branch name cannot contain ".."';
  if (branch.includes("~") || branch.includes("^") || branch.includes(":"))
    return "Branch name cannot contain ~, ^, or :";
  if (
    branch.startsWith("/") ||
    branch.endsWith("/") ||
    branch.endsWith(".lock")
  )
    return "Invalid branch name";
  return undefined;
}

export const RUN_ENV = {
  HUB_BASE_URL: "HUB_BASE_URL",
  HUB_TOKEN: "HUB_TOKEN",
  APP_ID: "APP_ID",
  TARGET_BRANCH: "TARGET_BRANCH",
} as const;

/** The Hub coordinates + branch a run was created with, from its spec.env. */
export interface RunHubCoordinates {
  appId?: string;
  targetBranch?: string;
  hubBaseUrl?: string;
  hasToken: boolean;
}

/**
 * Extract the Hub coordinates from a run's (or workflow run's) spec.env.
 * The shim injects HUB_TOKEN via valueFrom.secretKeyRef (no plain value),
 * so presence of the env entry — not a .value — is what counts.
 */
export function runHubCoordinates(
  env: EnvVar[] | undefined
): RunHubCoordinates {
  const value = (name: string) => env?.find((e) => e.name === name)?.value;
  return {
    appId: value(RUN_ENV.APP_ID),
    targetBranch: value(RUN_ENV.TARGET_BRANCH),
    hubBaseUrl: value(RUN_ENV.HUB_BASE_URL),
    hasToken: env?.some((e) => e.name === RUN_ENV.HUB_TOKEN) ?? false,
  };
}

// ----------------------------------------------------------------- RunApi

export interface CreateRunInput {
  agentRef: string;
  params?: Record<string, string>;
  instructions?: string;
  applicationRef?: string;
  targetBranch?: string;
  /** Gateway name; omit to let the controller default (single-gateway Agent). */
  gateway?: string;
}

export interface CreateWorkflowRunInput {
  workflowRef: string;
  params?: Record<string, string>;
  instructions?: string;
  applicationRef?: string;
  targetBranch?: string;
  /** Gateway name; omit to let the controller default (single-gateway Agent). */
  gateway?: string;
}

export interface RunApi {
  listAgents(): Promise<AgentResource[]>;
  getAgent(name: string): Promise<AgentResource>;
  listRuns(): Promise<AgentRun[]>;
  createRun(input: CreateRunInput): Promise<AgentRun>;
  getRun(name: string): Promise<AgentRun>;
  listWorkflows(): Promise<AgentWorkflow[]>;
  listWorkflowRuns(): Promise<AgentWorkflowRun[]>;
  getWorkflowRun(name: string): Promise<AgentWorkflowRun>;
  createWorkflowRun(input: CreateWorkflowRunInput): Promise<AgentWorkflowRun>;
}

// ---------------------------------------------------------------- waiting

export function isTerminalPhase(p?: string): boolean {
  return p === "Succeeded" || p === "Failed";
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(
        signal?.reason instanceof Error ? signal.reason : new Error("Aborted")
      );
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
