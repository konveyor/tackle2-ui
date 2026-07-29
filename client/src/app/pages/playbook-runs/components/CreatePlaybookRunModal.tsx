import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Form,
  FormGroup,
  FormHelperText,
  FormSelect,
  FormSelectOption,
  HelperText,
  HelperTextItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Spinner,
  TextInput,
} from "@patternfly/react-core";

import type {
  AgentParam,
  AgentPlaybook,
  AgentResource,
  Application,
  Condition,
} from "@app/api/agentic/contract";
import {
  defaultTargetBranch,
  invalidTargetBranchReason,
} from "@app/api/agentic/contract";
import { getAgent, getApplicationsWithSource } from "@app/api/rest";
import {
  ParamValueField,
  paramHelperText,
  paramValueInvalidReason,
  readyCondition,
} from "@app/pages/agent-runs/components/sources";
import {
  useCreatePlaybookRunMutation,
  useFetchPlaybooks,
} from "@app/queries/agent-runs";

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max - 1) + "…";
}

function playbookReadyCondition(pb: AgentPlaybook): Condition | undefined {
  return readyCondition(pb.status?.conditions);
}

/**
 * Selectable unless the controller has EXPLICITLY marked the playbook not
 * ready (AgentsNotReady etc.). No status yet — controller catching up or
 * not running — fails open: the shim re-validates on create anyway.
 */
function isSelectable(pb: AgentPlaybook): boolean {
  return playbookReadyCondition(pb)?.status !== "False";
}

/**
 * UNION of the stage Agents' declared params, in stage order. First
 * declaration wins the description/type/default (later defaults fill a
 * hole); required anywhere means required. Params forward wholesale to
 * every stage's AgentRun, so only params declared by EVERY stage agent
 * (see stagesMissingParam) are settable — the rest render disabled and
 * are never submitted (the shim rejects them with a 400 anyway).
 */
function mergeParams(agents: AgentResource[]): AgentParam[] {
  const merged = new Map<string, AgentParam>();
  for (const agent of agents) {
    for (const p of agent.spec.params ?? []) {
      const prev = merged.get(p.name);
      if (!prev) {
        merged.set(p.name, { ...p });
        continue;
      }
      if (p.required) prev.required = true;
      if (prev.default === undefined && p.default !== undefined)
        prev.default = p.default;
      if (!prev.description && p.description) prev.description = p.description;
    }
  }
  return [...merged.values()];
}

/** Names of the stage agents that do NOT declare the given param. */
function stagesMissingParam(agents: AgentResource[], name: string): string[] {
  return agents
    .filter((a) => !(a.spec.params ?? []).some((q) => q.name === name))
    .map((a) => a.metadata.name ?? "(unnamed)");
}

function defaultsFor(params: AgentParam[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const p of params) {
    values[p.name] = p.default ?? "";
  }
  return values;
}

interface CreatePlaybookRunModalProps {
  /** Pre-select this playbook (e.g. from a playbook row's "Run" action). */
  initialPlaybook?: string;
  onClose: () => void;
  onCreated: (runName: string) => void;
}

export const CreatePlaybookRunModal: React.FC<CreatePlaybookRunModalProps> = ({
  initialPlaybook,
  onClose,
  onCreated,
}) => {
  const {
    playbooks,
    isLoading: playbooksLoading,
    fetchError: playbooksError,
  } = useFetchPlaybooks();
  const [playbookName, setPlaybookName] = useState("");
  const initializedRef = useRef(false);
  // The selected playbook's stage Agents, fetched by name (get-by-name is
  // unfiltered, so stage agents without the managed label still resolve).
  const [stageAgents, setStageAgents] = useState<AgentResource[] | null>(null);
  const [agentsError, setAgentsError] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [applicationsError, setApplicationsError] = useState<string | null>(
    null
  );
  const [inventorySource, setInventorySource] = useState<
    "hub" | "stub" | "unknown" | null
  >(null);
  const [inventoryEndpoint, setInventoryEndpoint] = useState("");
  const [reloadingApps, setReloadingApps] = useState(false);
  const [applicationId, setApplicationId] = useState("");
  const [targetBranch, setTargetBranch] = useState(() => defaultTargetBranch());
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createMutation = useCreatePlaybookRunMutation(
    (run) => {
      const name = run.metadata.name;
      if (name) {
        onCreated(name);
      } else {
        setSubmitError("Shim returned a created run without metadata.name");
      }
    },
    (err) => setSubmitError(err.message)
  );
  const submitting = createMutation.isLoading;

  // Pick the initial playbook once the list first arrives: the pre-selected
  // one when given, else the first selectable one, else the first.
  useEffect(() => {
    if (initializedRef.current || playbooks.length === 0) return;
    initializedRef.current = true;
    const preferred =
      initialPlaybook &&
      playbooks.some((pb) => pb.metadata.name === initialPlaybook)
        ? initialPlaybook
        : (playbooks.find(isSelectable) ?? playbooks[0])?.metadata.name;
    if (preferred) setPlaybookName(preferred);
  }, [playbooks, initialPlaybook]);

  useEffect(() => {
    let disposed = false;
    getApplicationsWithSource()
      .then(({ source, endpoint, applications: list }) => {
        if (disposed) return;
        setApplications(list);
        setInventorySource(source);
        setInventoryEndpoint(endpoint);
      })
      .catch((err) => {
        if (!disposed) setApplicationsError(errorMessage(err));
      });
    return () => {
      disposed = true;
    };
  }, []);

  const reloadApplications = async () => {
    setReloadingApps(true);
    setApplicationsError(null);
    try {
      const {
        source,
        endpoint,
        applications: list,
      } = await getApplicationsWithSource();
      setApplications(list);
      setInventorySource(source);
      setInventoryEndpoint(endpoint);
    } catch (err) {
      setApplicationsError(errorMessage(err));
    } finally {
      setReloadingApps(false);
    }
  };

  const selected = playbooks.find((pb) => pb.metadata.name === playbookName);
  // Stable key so the polling playbook list (fresh array identity every
  // 2s) does not re-trigger the stage-agent fetch.
  const stageRefsKey = [
    ...new Set((selected?.spec.stages ?? []).map((s) => s.agentRef)),
  ].join(",");

  // Fetch the selected playbook's stage Agents — their declared params (as
  // a union) are the run's form. Params reset to the union's defaults.
  useEffect(() => {
    if (!playbookName) return;
    let disposed = false;
    setStageAgents(null);
    setAgentsError(null);
    const refs = stageRefsKey ? stageRefsKey.split(",") : [];
    Promise.all(refs.map((ref) => getAgent(ref)))
      .then((list) => {
        if (disposed) return;
        setStageAgents(list);
        setParamValues(defaultsFor(mergeParams(list)));
      })
      .catch((err) => {
        if (!disposed) setAgentsError(errorMessage(err));
      });
    return () => {
      disposed = true;
    };
  }, [playbookName, stageRefsKey]);

  const selectedReady = selected ? isSelectable(selected) : false;
  const notReady =
    selected && !selectedReady ? playbookReadyCondition(selected) : undefined;

  const mergedParams = mergeParams(stageAgents ?? []);
  // Only params declared by EVERY stage agent can be sent (params forward
  // wholesale to each stage); the rest render disabled below.
  const universalParams = mergedParams.filter(
    (p) => stagesMissingParam(stageAgents ?? [], p.name).length === 0
  );
  // The shim refuses application-scoped creates when the inventory is the
  // offline stub — stub applications have no Hub behind them to pull from.
  const stubInventory = inventorySource === "stub";
  const application = applications.find((a) => a.id === applicationId);
  // The harness clones from the Hub record — an application without a
  // repository URL dooms every stage, so block create up front.
  const repoMissing = !!application && !application.repository?.url;

  const missingRequired = universalParams.filter(
    (p) => p.required && !(paramValues[p.name] ?? "").trim()
  );
  const paramsInvalid = universalParams.some(
    (p) => paramValueInvalidReason(p, paramValues[p.name] ?? "") !== undefined
  );
  // Mirror the shim's validation: with an application, the shared target
  // branch must be a valid git refname and differ from the source branch.
  const branchInvalid =
    !!application &&
    (invalidTargetBranchReason(targetBranch) !== undefined ||
      (application.repository?.branch !== undefined &&
        targetBranch.trim() === application.repository.branch));
  const canCreate =
    !!selected &&
    selectedReady &&
    stageAgents !== null &&
    missingRequired.length === 0 &&
    !paramsInvalid &&
    !branchInvalid &&
    !repoMissing &&
    !submitting;

  const submit = () => {
    if (!selected || !canCreate) return;
    setSubmitError(null);
    // Send only universal params (the shim 400s params not declared by
    // every stage agent). Omit a value only when it is empty, or when it
    // equals the merged default AND every stage agent's declaration
    // carries that same default — a value that some stage would default
    // differently must be sent even if it matches the merged default.
    const params: Record<string, string> = {};
    for (const p of universalParams) {
      const v = (paramValues[p.name] ?? "").trim();
      if (!v) continue;
      const uniformDefault =
        p.default !== undefined &&
        (stageAgents ?? []).every((a) =>
          (a.spec.params ?? []).some(
            (q) => q.name === p.name && q.default === p.default
          )
        );
      if (uniformDefault && v === (p.default ?? "").trim()) continue;
      params[p.name] = v;
    }
    createMutation.mutate({
      playbookRef: selected.metadata.name ?? playbookName,
      params: Object.keys(params).length > 0 ? params : undefined,
      applicationRef: application?.id,
      targetBranch: application ? targetBranch.trim() : undefined,
    });
  };

  return (
    <Modal
      variant={ModalVariant.medium}
      isOpen
      onClose={() => {
        if (!submitting) onClose();
      }}
    >
      <ModalHeader
        title="Create playbook run"
        description="Creates an AgentPlaybookRun; the controller executes each stage as its own AgentRun, in order, on a shared target branch."
      />
      <ModalBody>
        {playbooksError && (
          <Alert
            variant="danger"
            isInline
            title="Failed to load playbooks"
            style={{ marginBottom: "1rem" }}
          >
            {playbooksError instanceof Error
              ? playbooksError.message
              : String(playbooksError)}
          </Alert>
        )}
        {submitError && (
          <Alert
            variant="danger"
            isInline
            title="Create failed"
            style={{ marginBottom: "1rem" }}
          >
            {submitError}
          </Alert>
        )}
        {playbooksLoading && playbooks.length === 0 && !playbooksError ? (
          <Spinner aria-label="Loading playbooks" />
        ) : playbooks.length === 0 ? (
          <Alert variant="warning" isInline title="No AgentPlaybook resources">
            The cluster has no AgentPlaybook CRs in the shim&apos;s namespace,
            so there is nothing to run.
          </Alert>
        ) : (
          <Form
            id="create-playbook-run-form"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <FormGroup label="Playbook" isRequired fieldId="create-playbook">
              <FormSelect
                id="create-playbook"
                value={playbookName}
                onChange={(_e, v) => setPlaybookName(v)}
              >
                {playbooks.map((pb) => (
                  <FormSelectOption
                    key={pb.metadata.name}
                    value={pb.metadata.name}
                    label={
                      (pb.metadata.name ?? "(unnamed)") +
                      (isSelectable(pb) ? "" : " (not ready)")
                    }
                    isDisabled={!isSelectable(pb)}
                  />
                ))}
              </FormSelect>
              {selected && selected.spec.stages.length > 0 && (
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem>
                      {selected.spec.stages.length} stage
                      {selected.spec.stages.length === 1 ? "" : "s"}:{" "}
                      {selected.spec.stages.map((s) => s.name).join(" → ")}
                    </HelperTextItem>
                    {selected.spec.guide && (
                      <HelperTextItem>
                        {truncate(selected.spec.guide, 160)}
                      </HelperTextItem>
                    )}
                  </HelperText>
                </FormHelperText>
              )}
            </FormGroup>

            {notReady && (
              <Alert variant="warning" isInline title="Playbook is not ready">
                {notReady.reason ?? "NotReady"}
                {notReady.message ? ` — ${notReady.message}` : ""}
              </Alert>
            )}

            {agentsError && (
              <Alert
                variant="danger"
                isInline
                title="Failed to load the playbook's stage agents"
              >
                {agentsError} — the run form is built from the stage
                Agents&apos; declared params, so a run cannot be created until
                they load.
              </Alert>
            )}
            {selected && stageAgents === null && !agentsError && (
              <Spinner size="md" aria-label="Loading stage agents" />
            )}

            {applicationsError && (
              <Alert
                variant="warning"
                isInline
                title="Failed to load applications"
              >
                {applicationsError} — playbook runs that work on a Hub
                application cannot be created until the inventory loads.
              </Alert>
            )}

            <FormGroup label="Application" fieldId="create-pb-application">
              <FormSelect
                id="create-pb-application"
                value={applicationId}
                onChange={(_e, v) => setApplicationId(v)}
              >
                <FormSelectOption
                  value=""
                  label="None — run without an application"
                />
                {applications.map((a) => (
                  <FormSelectOption
                    key={a.id}
                    value={a.id}
                    label={`${a.name}  ·  Hub #${a.id}`}
                    isDisabled={stubInventory}
                  />
                ))}
              </FormSelect>
              <FormHelperText>
                <HelperText>
                  {stubInventory && (
                    <HelperTextItem variant="warning">
                      Stub applications cannot back a run — the sandbox needs a
                      reachable Hub. Only &quot;None&quot; is usable until the
                      Hub connects.
                    </HelperTextItem>
                  )}
                  <HelperTextItem>
                    Every stage&apos;s harness pulls this application&apos;s
                    repository, credentials, and analysis from the Hub.
                    Migration playbooks fail without one.
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            </FormGroup>

            {inventorySource && (
              <div
                className={`inventory-source inventory-source-${inventorySource}`}
              >
                <span className="inventory-source-label">
                  {inventorySource === "hub"
                    ? `${applications.length} application${applications.length === 1 ? "" : "s"} from Konveyor Hub`
                    : inventorySource === "stub"
                      ? "Hub unavailable — showing offline stub"
                      : "Application inventory"}
                </span>
                <code className="inventory-source-endpoint">
                  {inventoryEndpoint}
                </code>
                <Button
                  variant="link"
                  isInline
                  isLoading={reloadingApps}
                  isDisabled={reloadingApps}
                  onClick={() => void reloadApplications()}
                >
                  Refresh
                </Button>
              </div>
            )}

            {repoMissing && (
              <Alert
                variant="danger"
                isInline
                title="Application has no repository"
              >
                {application?.name} has no repository URL in the Hub — the
                harness clones from the Hub record, so these stages cannot
                start. Set the application&apos;s source repository first.
              </Alert>
            )}

            {application && (
              <FormGroup
                label="Target branch"
                isRequired
                fieldId="create-pb-target-branch"
              >
                <TextInput
                  id="create-pb-target-branch"
                  isRequired
                  value={targetBranch}
                  onChange={(_e, v) => setTargetBranch(v)}
                  validated={branchInvalid ? "error" : "default"}
                />
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem
                      variant={branchInvalid ? "error" : "default"}
                    >
                      {branchInvalid
                        ? "Must be a valid git branch name and differ from the application's source branch."
                        : "One branch, all stages: each stage continues the previous stage's work on it (plan commits PLAN.md, execute reads it)."}
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              </FormGroup>
            )}

            {mergedParams.map((p) => {
              const missingStages = stagesMissingParam(
                stageAgents ?? [],
                p.name
              );
              const partial = missingStages.length > 0;
              const helper = paramHelperText(p);
              const invalidReason = partial
                ? undefined
                : paramValueInvalidReason(p, paramValues[p.name] ?? "");
              return (
                <FormGroup
                  key={p.name}
                  label={p.name}
                  isRequired={!partial && p.required}
                  fieldId={`pb-param-${p.name}`}
                >
                  <ParamValueField
                    id={`pb-param-${p.name}`}
                    param={p}
                    value={paramValues[p.name] ?? ""}
                    isDisabled={partial}
                    onChange={(v) =>
                      setParamValues((prev) => ({ ...prev, [p.name]: v }))
                    }
                  />
                  {(partial || helper || invalidReason) && (
                    <FormHelperText>
                      <HelperText>
                        {partial && (
                          <HelperTextItem variant="warning">
                            not declared by stage
                            {missingStages.length === 1 ? "" : "s"}{" "}
                            {missingStages.join(", ")} — cannot be set on a
                            playbook run (params forward to every stage)
                          </HelperTextItem>
                        )}
                        {invalidReason && (
                          <HelperTextItem variant="error">
                            {invalidReason}
                          </HelperTextItem>
                        )}
                        {helper && <HelperTextItem>{helper}</HelperTextItem>}
                      </HelperText>
                    </FormHelperText>
                  )}
                </FormGroup>
              );
            })}
          </Form>
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          isDisabled={!canCreate}
          isLoading={submitting}
          onClick={submit}
        >
          Create
        </Button>
        <Button variant="link" isDisabled={submitting} onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};
