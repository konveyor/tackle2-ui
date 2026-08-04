/**
 * Contract types + helpers for the konveyor.io/v1alpha1 agent surface.
 *
 * Source of truth: github.com/konveyor/agentic-controller api/v1alpha1/*.go
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

export interface AgentRunModelSelection {
  role: string;
  provider: string;
  model: string;
}

export interface AgentRunSpec {
  agentRef: string;
  params?: AgentRunParam[];
  instructions?: string;
  models?: AgentRunModelSelection[];
  env?: EnvVar[];
  envFrom?: EnvFromSource[];
}

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
  providers?: { ref: string }[];
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

// ------------------------------------------------------------ Application

/**
 * A Hub application as surfaced by the shim's inventory endpoint. Named
 * distinctly from api/models.ts Application (numeric id, full Hub shape)
 * to keep the two API families from cross-importing by accident.
 */
export interface AgenticApplication {
  id: string;
  name: string;
  repository?: { url: string; branch?: string };
  identity?: { name: string };
  identitySecret?: string;
}

// -------------------------------------------------------------- AgentImage

export interface AgentImage {
  name: string;
  image: string;
  displayName: string;
  description: string;
  languages: string[];
  parent: string | null;
}

// --------------------------------------------------------------- SkillCard

export type SkillCardType = "skill" | "rule";

export interface SkillCardSpec {
  displayName?: string;
  description?: string;
  image?: string;
  inline?: string;
  source?: string;
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
    resolvedImage?: string;
    conditions?: Condition[];
  };
}

// --------------------------------------------------------- SkillCollection

export interface SkillCollectionSkillRef {
  name: string;
  skillCardRef?: string;
  image?: string;
  source?: string;
}

export interface SkillCollectionSpec {
  skills?: SkillCollectionSkillRef[];
}

export interface SkillCollection {
  apiVersion?: string;
  kind?: string;
  metadata: ObjectMeta;
  spec: SkillCollectionSpec;
  status?: { observedGeneration?: number; conditions?: Condition[] };
}

// ------------------------------------------------------------- LLMProvider

export interface LLMProviderModel {
  name: string;
  contextWindow: number;
  tier?: string;
}

export interface LLMProvider {
  apiVersion?: string;
  kind?: string;
  metadata: ObjectMeta;
  spec: {
    endpoint: string;
    credentialRef: { secretName: string; key: string };
    models: LLMProviderModel[];
  };
  status?: {
    observedGeneration?: number;
    connectionVerified?: boolean;
    discoveredModels?: string[];
    conditions?: Condition[];
  };
}

// ---------------------------------------------------------- AgentWorkload

export const STAGE_NAME_PATTERN = /^[a-z]([a-z0-9-]*[a-z0-9])?$/;

export interface AgentWorkloadStage {
  name: string;
  agentRef: string;
  instructions?: string;
}

export interface AgentWorkloadSpec {
  guide?: string;
  stages: AgentWorkloadStage[];
}

export interface AgentWorkload {
  apiVersion?: string;
  kind?: string;
  metadata: ObjectMeta;
  spec: AgentWorkloadSpec;
  status?: { observedGeneration?: number; conditions?: Condition[] };
}

// ------------------------------------------------------- AgentWorkloadRun

export type AgentWorkloadRunPhase =
  | "Pending"
  | "Running"
  | "Succeeded"
  | "Failed";

export interface AgentWorkloadRunStageStatus {
  name: string;
  phase?: AgentRunPhase;
  agentRunName?: string;
}

export interface AgentWorkloadRunStatus {
  phase?: AgentWorkloadRunPhase;
  observedGeneration?: number;
  currentStage?: string;
  stages?: AgentWorkloadRunStageStatus[];
  startTime?: string;
  completionTime?: string;
  conditions?: Condition[];
}

export interface AgentWorkloadRun {
  apiVersion?: string;
  kind?: string;
  metadata: ObjectMeta;
  spec: {
    workloadRef: string;
    models?: AgentRunModelSelection[];
    params?: AgentRunParam[];
    instructions?: string;
    env?: EnvVar[];
    envFrom?: EnvFromSource[];
  };
  status?: AgentWorkloadRunStatus;
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
 * Extract the Hub coordinates from a run's (or workload run's) spec.env.
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

// --------------------------------------------------------- seeded defaults

/** Outcome for one resource of a RunApi.loadDefaults seeding pass. */
export interface SeedResult {
  kind: string;
  name: string;
  /** "exists" means the resource was already there — seeding never updates. */
  status: "created" | "exists";
}

// ----------------------------------------------------------------- RunApi

export interface CreateRunInput {
  agentRef: string;
  params?: Record<string, string>;
  instructions?: string;
  applicationRef?: string;
  targetBranch?: string;
  model?: { provider: string; model: string };
}

export interface CreateWorkloadRunInput {
  workloadRef: string;
  params?: Record<string, string>;
  instructions?: string;
  applicationRef?: string;
  targetBranch?: string;
  model?: { provider: string; model: string };
}

export interface RunApi {
  listAgents(): Promise<AgentResource[]>;
  getAgent(name: string): Promise<AgentResource>;
  listApplications(): Promise<AgenticApplication[]>;
  listImages(): Promise<AgentImage[]>;
  listRuns(): Promise<AgentRun[]>;
  createRun(input: CreateRunInput): Promise<AgentRun>;
  getRun(name: string): Promise<AgentRun>;
  deleteRun(name: string): Promise<void>;
  listWorkloads(): Promise<AgentWorkload[]>;
  listWorkloadRuns(): Promise<AgentWorkloadRun[]>;
  getWorkloadRun(name: string): Promise<AgentWorkloadRun>;
  createWorkloadRun(input: CreateWorkloadRunInput): Promise<AgentWorkloadRun>;
  deleteWorkloadRun(name: string): Promise<void>;
  /**
   * Seeds the default managed resource set (provider, stage agents, skill
   * cards, workloads, image catalog). Idempotent: existing resources are
   * left untouched and reported as "exists".
   */
  loadDefaults(): Promise<SeedResult[]>;
}

// ---------------------------------------------------------------- waiting

export function isTerminalPhase(p?: string): boolean {
  return p === "Succeeded" || p === "Failed";
}

export interface WaitForRunningOptions {
  timeoutMs?: number;
  pollMs?: number;
  signal?: AbortSignal;
  onPhase?: (phase: string, elapsedMs: number) => void;
}

export async function waitForRunning(
  api: Pick<RunApi, "getRun">,
  name: string,
  opts?: WaitForRunningOptions
): Promise<AgentRun> {
  const timeoutMs = opts?.timeoutMs ?? 120_000;
  const pollMs = opts?.pollMs ?? 1_000;
  const started = Date.now();
  for (;;) {
    opts?.signal?.throwIfAborted();
    const run = await api.getRun(name);
    const phase = run.status?.phase ?? "Pending";
    const elapsed = Date.now() - started;
    opts?.onPhase?.(phase, elapsed);
    if (phase === "Failed") {
      const detail = (run.status?.conditions ?? [])
        .map((c) => c.message)
        .filter(Boolean)
        .join("; ");
      throw new Error(`AgentRun ${name} failed${detail ? `: ${detail}` : ""}`);
    }
    if (
      phase === "Running" &&
      run.status?.sandboxName &&
      run.status?.secretKeyRef?.name
    ) {
      return run;
    }
    if (Date.now() - started >= timeoutMs) {
      throw new Error(
        `Timed out after ${timeoutMs}ms waiting for AgentRun ${name} to reach Running with a ` +
          `sandbox and ACP key (last phase=${phase}, sandboxName=${run.status?.sandboxName ?? "unset"}, ` +
          `secretKeyRef=${run.status?.secretKeyRef?.name ?? "unset"}).`
      );
    }
    await sleep(pollMs, opts?.signal);
  }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
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
