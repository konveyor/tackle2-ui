import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
  AgentResource,
  AgentWorkload,
  Condition,
} from "@app/api/agentic/contract";
import {
  defaultTargetBranch,
  invalidTargetBranchReason,
} from "@app/api/agentic/contract";
import { getAgent } from "@app/api/rest";
import {
  ParamValueField,
  paramHelperText,
  paramValueInvalidReason,
} from "@app/pages/agent-runs/components/ParamFields";
import { readyCondition } from "@app/pages/agent-runs/components/ReadyLabel";
import { useFetchAgenticApplications } from "@app/queries/agentic-catalog";
import { useCreateWorkloadRunMutation } from "@app/queries/workload-runs";
import { useFetchWorkloads } from "@app/queries/workloads";
import { truncate } from "@app/utils/agentic";
import { getAxiosErrorMessage } from "@app/utils/utils";

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function workloadReadyCondition(pb: AgentWorkload): Condition | undefined {
  return readyCondition(pb.status?.conditions);
}

/**
 * Selectable unless the controller has EXPLICITLY marked the workload not
 * ready (AgentsNotReady etc.). No status yet — controller catching up or
 * not running — fails open: the shim re-validates on create anyway.
 */
function isSelectable(pb: AgentWorkload): boolean {
  return workloadReadyCondition(pb)?.status !== "False";
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
function stagesMissingParam(
  agents: AgentResource[],
  name: string,
  unnamedLabel: string
): string[] {
  return agents
    .filter((a) => !(a.spec.params ?? []).some((q) => q.name === name))
    .map((a) => a.metadata.name ?? unnamedLabel);
}

function defaultsFor(params: AgentParam[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const p of params) {
    values[p.name] = p.default ?? "";
  }
  return values;
}

interface CreateWorkloadRunModalProps {
  /** Pre-select this workload (e.g. from a workload row's "Run" action). */
  initialWorkload?: string;
  onClose: () => void;
  onCreated: (runName: string) => void;
}

export const CreateWorkloadRunModal: React.FC<CreateWorkloadRunModalProps> = ({
  initialWorkload,
  onClose,
  onCreated,
}) => {
  const { t } = useTranslation();
  const {
    workloads,
    isLoading: workloadsLoading,
    fetchError: workloadsError,
  } = useFetchWorkloads();
  const [workloadName, setWorkloadName] = useState("");
  const initializedRef = useRef(false);
  // The selected workload's stage Agents, fetched by name (get-by-name is
  // unfiltered, so stage agents without the managed label still resolve).
  const [stageAgents, setStageAgents] = useState<AgentResource[] | null>(null);
  const [agentsError, setAgentsError] = useState<string | null>(null);
  const [reloadingApps, setReloadingApps] = useState(false);
  const [applicationId, setApplicationId] = useState("");
  const [targetBranch, setTargetBranch] = useState(() => defaultTargetBranch());
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createMutation = useCreateWorkloadRunMutation(
    (run) => {
      const name = run.metadata.name;
      if (name) {
        onCreated(name);
      } else {
        setSubmitError(t("agentic.workloadRuns.createdWithoutName"));
      }
    },
    (err) => setSubmitError(getAxiosErrorMessage(err))
  );
  const submitting = createMutation.isLoading;

  const {
    applications,
    source: inventorySource,
    endpoint: inventoryEndpoint,
    fetchError: applicationsFetchError,
    refetch: refetchApplications,
  } = useFetchAgenticApplications();
  const applicationsError = applicationsFetchError
    ? getAxiosErrorMessage(applicationsFetchError)
    : null;

  // Pick the initial workload once the list first arrives: the pre-selected
  // one when given, else the first selectable one, else the first.
  useEffect(() => {
    if (initializedRef.current || workloads.length === 0) return;
    initializedRef.current = true;
    const preferred =
      initialWorkload &&
      workloads.some((pb) => pb.metadata.name === initialWorkload)
        ? initialWorkload
        : (workloads.find(isSelectable) ?? workloads[0])?.metadata.name;
    if (preferred) setWorkloadName(preferred);
  }, [workloads, initialWorkload]);

  const reloadApplications = async () => {
    setReloadingApps(true);
    try {
      await refetchApplications();
    } finally {
      setReloadingApps(false);
    }
  };

  const selected = workloads.find((pb) => pb.metadata.name === workloadName);
  // Stable key so the polling workload list (fresh array identity every
  // 2s) does not re-trigger the stage-agent fetch.
  const stageRefsKey = [
    ...new Set((selected?.spec.stages ?? []).map((s) => s.agentRef)),
  ].join(",");

  // Fetch the selected workload's stage Agents — their declared params (as
  // a union) are the run's form. Params reset to the union's defaults.
  useEffect(() => {
    if (!workloadName) return;
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
  }, [workloadName, stageRefsKey]);

  const selectedReady = selected ? isSelectable(selected) : false;
  const notReady =
    selected && !selectedReady ? workloadReadyCondition(selected) : undefined;

  const mergedParams = mergeParams(stageAgents ?? []);
  // Only params declared by EVERY stage agent can be sent (params forward
  // wholesale to each stage); the rest render disabled below.
  const unnamedLabel = t("agentic.workloadRuns.unnamed");
  const universalParams = mergedParams.filter(
    (p) =>
      stagesMissingParam(stageAgents ?? [], p.name, unnamedLabel).length === 0
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
      workloadRef: selected.metadata.name ?? workloadName,
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
        title={t("agentic.workloadRuns.create")}
        description={t("agentic.workloadRuns.createDescription")}
      />
      <ModalBody>
        {workloadsError && (
          <Alert
            variant="danger"
            isInline
            title={t("agentic.workloadRuns.failedLoadWorkloadsTitle")}
            style={{ marginBottom: "1rem" }}
          >
            {getAxiosErrorMessage(workloadsError)}
          </Alert>
        )}
        {submitError && (
          <Alert
            variant="danger"
            isInline
            title={t("agentic.workloadRuns.createFailedTitle")}
            style={{ marginBottom: "1rem" }}
          >
            {submitError}
          </Alert>
        )}
        {workloadsLoading && workloads.length === 0 && !workloadsError ? (
          <Spinner aria-label={t("agentic.workloadRuns.loadingWorkloads")} />
        ) : workloads.length === 0 ? (
          <Alert
            variant="warning"
            isInline
            title={t("agentic.workloadRuns.noWorkloadsTitle")}
          >
            {t("agentic.workloadRuns.noWorkloadsBody")}
          </Alert>
        ) : (
          <Form
            id="create-workload-run-form"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <FormGroup
              label={t("terms.workload")}
              isRequired
              fieldId="create-workload"
            >
              <FormSelect
                id="create-workload"
                value={workloadName}
                onChange={(_e, v) => setWorkloadName(v)}
              >
                {workloads.map((pb) => (
                  <FormSelectOption
                    key={pb.metadata.name}
                    value={pb.metadata.name}
                    label={
                      (pb.metadata.name ?? unnamedLabel) +
                      (isSelectable(pb)
                        ? ""
                        : ` ${t("agentic.workloadRuns.notReadySuffix")}`)
                    }
                    isDisabled={!isSelectable(pb)}
                  />
                ))}
              </FormSelect>
              {selected && selected.spec.stages.length > 0 && (
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem>
                      {t("agentic.workloadRuns.stageCount", {
                        count: selected.spec.stages.length,
                        stages: selected.spec.stages
                          .map((s) => s.name)
                          .join(" → "),
                      })}
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
              <Alert
                variant="warning"
                isInline
                title={t("agentic.workloadRuns.workloadNotReadyTitle")}
              >
                {notReady.reason ?? "NotReady"}
                {notReady.message ? ` — ${notReady.message}` : ""}
              </Alert>
            )}

            {agentsError && (
              <Alert
                variant="danger"
                isInline
                title={t("agentic.workloadRuns.failedLoadStageAgentsTitle")}
              >
                {t("agentic.workloadRuns.failedLoadStageAgentsBody", {
                  error: agentsError,
                })}
              </Alert>
            )}
            {selected && stageAgents === null && !agentsError && (
              <Spinner
                size="md"
                aria-label={t("agentic.workloadRuns.loadingStageAgents")}
              />
            )}

            {applicationsError && (
              <Alert
                variant="warning"
                isInline
                title={t("agentic.workloadRuns.failedLoadApplicationsTitle")}
              >
                {t("agentic.workloadRuns.failedLoadApplicationsBody", {
                  error: applicationsError,
                })}
              </Alert>
            )}

            <FormGroup
              label={t("terms.application")}
              fieldId="create-pb-application"
            >
              <FormSelect
                id="create-pb-application"
                value={applicationId}
                onChange={(_e, v) => setApplicationId(v)}
              >
                <FormSelectOption
                  value=""
                  label={t("agentic.workloadRuns.noApplicationOption")}
                />
                {applications.map((a) => (
                  <FormSelectOption
                    key={a.id}
                    value={a.id}
                    label={t("agentic.workloadRuns.applicationOption", {
                      name: a.name,
                      id: a.id,
                    })}
                    isDisabled={stubInventory}
                  />
                ))}
              </FormSelect>
              <FormHelperText>
                <HelperText>
                  {stubInventory && (
                    <HelperTextItem variant="warning">
                      {t("agentic.workloadRuns.stubInventoryHelper")}
                    </HelperTextItem>
                  )}
                  <HelperTextItem>
                    {t("agentic.workloadRuns.applicationHelper")}
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
                    ? t("agentic.workloadRuns.hubApplicationCount", {
                        count: applications.length,
                      })
                    : inventorySource === "stub"
                      ? t("agentic.workloadRuns.stubInventoryLabel")
                      : t("composed.applicationInventory")}
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
                  {t("terms.refresh")}
                </Button>
              </div>
            )}

            {repoMissing && (
              <Alert
                variant="danger"
                isInline
                title={t("agentic.workloadRuns.noRepositoryTitle")}
              >
                {t("agentic.workloadRuns.noRepositoryBody", {
                  name: application?.name,
                })}
              </Alert>
            )}

            {application && (
              <FormGroup
                label={t("terms.targetBranch")}
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
                        ? t("agentic.workloadRuns.targetBranchInvalid")
                        : t("agentic.workloadRuns.targetBranchHelper")}
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              </FormGroup>
            )}

            {mergedParams.map((p) => {
              const missingStages = stagesMissingParam(
                stageAgents ?? [],
                p.name,
                unnamedLabel
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
                            {t("agentic.workloadRuns.paramNotDeclared", {
                              count: missingStages.length,
                              stages: missingStages.join(", "),
                            })}
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
          id="create-workload-run-submit"
          variant="primary"
          isDisabled={!canCreate}
          isLoading={submitting}
          onClick={submit}
        >
          {t("actions.create")}
        </Button>
        <Button
          id="create-workload-run-cancel"
          variant="link"
          isDisabled={submitting}
          onClick={onClose}
        >
          {t("actions.cancel")}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
