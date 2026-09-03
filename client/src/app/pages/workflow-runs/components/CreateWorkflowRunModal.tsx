import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Button,
  Form,
  FormGroup,
  FormHelperText,
  FormSection,
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
  AgentWorkflow,
  AgentWorkflowRun,
  Condition,
} from "@app/api/agentic/contract";
import {
  APPLICATION_LABEL,
  defaultTargetBranch,
} from "@app/api/agentic/contract";
import type { Application } from "@app/api/models";
import { getAgent } from "@app/api/rest";
import {
  GatewayPicker,
  defaultGatewayFor,
} from "@app/pages/agent-runs/components/GatewayPicker";
import {
  ParamValueField,
  paramHelperText,
  paramValueInvalidReason,
} from "@app/pages/agent-runs/components/ParamFields";
import { readyCondition } from "@app/pages/agent-runs/components/ReadyLabel";
import { useFetchGateways } from "@app/queries/agentic-catalog";
import { useFetchApplications } from "@app/queries/applications";
import { useCreateWorkflowRunMutation } from "@app/queries/workflow-runs";
import { useFetchWorkflows } from "@app/queries/workflows";
import {
  applicationLabelValue,
  applicationRunBlocker,
  targetBranchBlocker,
  truncate,
} from "@app/utils/agentic";
import { getAxiosErrorMessage } from "@app/utils/utils";

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function workflowReadyCondition(pb: AgentWorkflow): Condition | undefined {
  return readyCondition(pb.status?.conditions);
}

/**
 * Selectable unless the controller has EXPLICITLY marked the workflow not
 * ready (AgentsNotReady etc.). No status yet — controller catching up or
 * not running — fails open: the shim re-validates on create anyway.
 */
function isSelectable(pb: AgentWorkflow): boolean {
  return workflowReadyCondition(pb)?.status !== "False";
}

/**
 * UNION of the stage Agents' declared params, in stage order. First
 * declaration wins the description/type/default (later defaults fill a
 * hole); required anywhere means required. The workflow controller filters
 * this union per stage, so a parameter may legitimately apply to only some
 * stage Agents.
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

function defaultsFor(params: AgentParam[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const p of params) {
    values[p.name] = p.default ?? "";
  }
  return values;
}

/**
 * Gateways declared by EVERY stage agent — the run's one gateway propagates
 * to every stage, so a gateway missing from any stage agent's list fails
 * that stage. Stage order is preserved from the first agent's declaration.
 */
function sharedGateways(agents: AgentResource[]): { ref: string }[] {
  if (agents.length === 0) return [];
  const [first, ...rest] = agents;
  return (first!.spec.gateways ?? []).filter(({ ref }) =>
    rest.every((a) => (a.spec.gateways ?? []).some((g) => g.ref === ref))
  );
}

interface CreateWorkflowRunModalProps {
  /** Pre-select this workflow (e.g. from a workflow row's "Run" action). */
  initialWorkflow?: string;
  /**
   * Seed the form from an earlier run ("Run again"): its workflow, params,
   * gateway and application. The target branch is not reused — the old one
   * holds the earlier results — so a re-run gets a fresh migration branch
   * by default, editable like any other.
   */
  prefill?: AgentWorkflowRun;
  /**
   * Run against this application instead of asking for one. Supplied by
   * callers that already have the application in hand (an inventory row);
   * the picker is skipped. `useFetchApplications` has no `enabled` gate, so
   * the applications list still loads in the background (react-query dedupes
   * it against whatever already populated the shared "applications" cache).
   */
  application?: Application;
  onClose: () => void;
  onCreated: (runName: string) => void;
}

export const CreateWorkflowRunModal: React.FC<CreateWorkflowRunModalProps> = ({
  initialWorkflow: initialWorkflowProp,
  prefill,
  application: fixedApplication,
  onClose,
  onCreated,
}) => {
  const { t } = useTranslation();
  // The prefill is read once: the caller's run object is a polled query
  // result whose identity changes every refetch, and the stage-agent
  // effect below must not re-run (and reset the form) on each one.
  const [initialPrefill] = useState(prefill);
  const initialWorkflow =
    initialPrefill?.spec.workflowRef ?? initialWorkflowProp;
  // The earlier run's params and gateway land once its workflow's stage
  // agents are loaded (the form's fields come from them); consumed once.
  const prefillPending = useRef(!!initialPrefill);
  const {
    workflows,
    isLoading: workflowsLoading,
    fetchError: workflowsError,
  } = useFetchWorkflows();
  const [workflowName, setWorkflowName] = useState("");
  const [workflowSeeded, setWorkflowSeeded] = useState(false);
  // The selected workflow's stage Agents, fetched by name (get-by-name is
  // unfiltered, so stage agents without the managed label still resolve).
  const [stageAgents, setStageAgents] = useState<AgentResource[] | null>(null);
  const [agentsError, setAgentsError] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState(
    () => initialPrefill?.metadata.labels?.[APPLICATION_LABEL] ?? ""
  );
  const [targetBranch, setTargetBranch] = useState(() => defaultTargetBranch());
  const [gateway, setGateway] = useState<string | undefined>(undefined);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createMutation = useCreateWorkflowRunMutation(
    (run) => {
      const name = run.metadata.name;
      if (name) {
        onCreated(name);
      } else {
        setSubmitError(t("agentic.workflowRuns.createdWithoutName"));
      }
    },
    (err) => setSubmitError(getAxiosErrorMessage(err))
  );
  const submitting = createMutation.isLoading;

  const { data: applications, error: applicationsFetchError } =
    useFetchApplications();
  const applicationsError = applicationsFetchError
    ? getAxiosErrorMessage(applicationsFetchError)
    : null;

  const { gateways } = useFetchGateways();

  // Pick the initial workflow once the list first arrives: the pre-selected
  // one when given, else the first selectable one, else the first. A
  // render-phase adjustment (not an effect) so the settled state commits
  // in one pass.
  if (!workflowSeeded && workflows.length > 0) {
    setWorkflowSeeded(true);
    const preferred =
      initialWorkflow &&
      workflows.some((pb) => pb.metadata.name === initialWorkflow)
        ? initialWorkflow
        : (workflows.find(isSelectable) ?? workflows[0])?.metadata.name;
    if (preferred) setWorkflowName(preferred);
  }

  const selected = workflows.find((pb) => pb.metadata.name === workflowName);
  // Stable key so the polling workflow list (fresh array identity every
  // 2s) does not re-trigger the stage-agent fetch.
  const stageRefsKey = [
    ...new Set((selected?.spec.stages ?? []).map((s) => s.agentRef)),
  ].join(",");

  // Reset the stage-agent panel the moment the selection changes — a
  // render-phase adjustment keyed on the selection, so the old workflow's
  // agents never flash under the new selection while the fetch runs.
  const selectionKey = `${workflowName}|${stageRefsKey}`;
  const [resetKey, setResetKey] = useState(selectionKey);
  if (resetKey !== selectionKey) {
    setResetKey(selectionKey);
    setStageAgents(null);
    setAgentsError(null);
  }

  const workflowParamsKey = JSON.stringify(selected?.spec.params ?? []);

  // Fetch the selected workflow's stage Agents. Their declared params form
  // the agent-scoped section; the workflow's declarations form the separate
  // workflow-scoped section written to params.json.
  useEffect(() => {
    if (!workflowName) return;
    let disposed = false;
    const refs = stageRefsKey ? stageRefsKey.split(",") : [];
    const workflowParams: AgentParam[] = JSON.parse(workflowParamsKey);
    Promise.all(refs.map((ref) => getAgent(ref)))
      .then((list) => {
        if (disposed) return;
        setStageAgents(list);
        const defaults = defaultsFor([...workflowParams, ...mergeParams(list)]);
        const shared = sharedGateways(list);
        // Apply the earlier run's values once, and only on its own
        // workflow — a prefill whose workflow is gone seeds a different
        // one and must not carry its inputs there.
        const applyPrefill =
          prefillPending.current &&
          !!initialPrefill &&
          initialPrefill.spec.workflowRef === workflowName;
        prefillPending.current = false;
        if (applyPrefill) {
          const values = { ...defaults };
          for (const p of initialPrefill.spec.params ?? []) {
            values[p.name] = p.value;
          }
          setParamValues(values);
          setGateway(
            initialPrefill.spec.gateway &&
              shared.some((g) => g.ref === initialPrefill.spec.gateway)
              ? initialPrefill.spec.gateway
              : defaultGatewayFor(shared)
          );
        } else {
          setParamValues(defaults);
          setGateway(defaultGatewayFor(shared));
        }
      })
      .catch((err) => {
        if (!disposed) setAgentsError(errorMessage(err));
      });
    return () => {
      disposed = true;
    };
  }, [workflowName, stageRefsKey, workflowParamsKey, initialPrefill]);

  const prefillWorkflowMissing =
    !!initialPrefill &&
    workflows.length > 0 &&
    !workflows.some(
      (pb) => pb.metadata.name === initialPrefill.spec.workflowRef
    );

  const selectedReady = selected ? isSelectable(selected) : false;
  const notReady =
    selected && !selectedReady ? workflowReadyCondition(selected) : undefined;

  const gatewayRefs = sharedGateways(stageAgents ?? []);
  const agentParams = mergeParams(stageAgents ?? []);
  const workflowParams = selected?.spec.params ?? [];
  const allParams = [...workflowParams, ...agentParams];
  const unnamedLabel = t("agentic.workflowRuns.unnamed");
  const application =
    fixedApplication ??
    applications.find((a) => applicationLabelValue(a) === applicationId);
  // The harness clones from the Hub record — an application without a
  // repository URL dooms every stage, so block create up front.
  const repoMissing =
    !!application && applicationRunBlocker(application) !== undefined;

  const missingRequired = allParams.filter(
    (p) => p.required && !(paramValues[p.name] ?? "").trim()
  );
  const paramsInvalid = allParams.some(
    (p) => paramValueInvalidReason(p, paramValues[p.name] ?? "") !== undefined
  );
  // Mirror the shim's validation: with an application, the shared target
  // branch must be a valid git refname and differ from the source branch.
  const branchInvalid =
    !!application &&
    targetBranchBlocker(application, targetBranch) !== undefined;
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
    // The controller routes each supplied value to the workflow scope and
    // only the stage Agents that declare it. Omit a shared default only when
    // every declaration with this name agrees on that default.
    const params: Record<string, string> = {};
    for (const p of allParams) {
      const v = (paramValues[p.name] ?? "").trim();
      if (!v) continue;
      const declarations = [
        ...workflowParams.filter((q) => q.name === p.name),
        ...(stageAgents ?? []).flatMap((a) =>
          (a.spec.params ?? []).filter((q) => q.name === p.name)
        ),
      ];
      const uniformDefault = declarations.every(
        (q) => q.default !== undefined && q.default === p.default
      );
      if (uniformDefault && v === (p.default ?? "").trim()) continue;
      params[p.name] = v;
    }
    createMutation.mutate({
      workflowRef: selected.metadata.name ?? workflowName,
      params: Object.keys(params).length > 0 ? params : undefined,
      applicationRef: application
        ? applicationLabelValue(application)
        : undefined,
      targetBranch: application ? targetBranch.trim() : undefined,
      gateway,
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
        title={
          initialPrefill
            ? t("agentic.workflowRuns.rerunTitle", {
                name: initialPrefill.metadata.name,
              })
            : t("agentic.workflowRuns.create")
        }
        description={t("agentic.workflowRuns.createDescription")}
      />
      <ModalBody>
        {prefillWorkflowMissing && (
          <Alert
            variant="warning"
            isInline
            title={t("agentic.workflowRuns.prefillWorkflowMissing", {
              name: initialPrefill?.spec.workflowRef,
            })}
            style={{ marginBottom: "1rem" }}
          />
        )}
        {workflowsError && (
          <Alert
            variant="danger"
            isInline
            title={t("agentic.workflowRuns.failedLoadWorkflowsTitle")}
            style={{ marginBottom: "1rem" }}
          >
            {getAxiosErrorMessage(workflowsError)}
          </Alert>
        )}
        {submitError && (
          <Alert
            variant="danger"
            isInline
            title={t("agentic.workflowRuns.createFailedTitle")}
            style={{ marginBottom: "1rem" }}
          >
            {submitError}
          </Alert>
        )}
        {workflowsLoading && workflows.length === 0 && !workflowsError ? (
          <Spinner aria-label={t("agentic.workflowRuns.loadingWorkflows")} />
        ) : workflows.length === 0 ? (
          <Alert
            variant="warning"
            isInline
            title={t("agentic.workflowRuns.noWorkflowsTitle")}
          >
            {t("agentic.workflowRuns.noWorkflowsBody")}
          </Alert>
        ) : (
          <Form
            id="create-workflow-run-form"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <FormGroup
              label={t("terms.workflow")}
              isRequired
              fieldId="create-workflow"
            >
              <FormSelect
                id="create-workflow"
                value={workflowName}
                onChange={(_e, v) => setWorkflowName(v)}
              >
                {workflows.map((pb) => (
                  <FormSelectOption
                    key={pb.metadata.name}
                    value={pb.metadata.name}
                    label={
                      (pb.metadata.name ?? unnamedLabel) +
                      (isSelectable(pb)
                        ? ""
                        : ` ${t("agentic.workflowRuns.notReadySuffix")}`)
                    }
                    isDisabled={!isSelectable(pb)}
                  />
                ))}
              </FormSelect>
              {selected && selected.spec.stages.length > 0 && (
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem>
                      {t("agentic.workflowRuns.stageCount", {
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
                title={t("agentic.workflowRuns.workflowNotReadyTitle")}
              >
                {notReady.reason ?? "NotReady"}
                {notReady.message ? ` — ${notReady.message}` : ""}
              </Alert>
            )}

            {agentsError && (
              <Alert
                variant="danger"
                isInline
                title={t("agentic.workflowRuns.failedLoadStageAgentsTitle")}
              >
                {t("agentic.workflowRuns.failedLoadStageAgentsBody", {
                  error: agentsError,
                })}
              </Alert>
            )}
            {selected && stageAgents === null && !agentsError && (
              <Spinner
                size="md"
                aria-label={t("agentic.workflowRuns.loadingStageAgents")}
              />
            )}

            <GatewayPicker
              gatewayRefs={gatewayRefs}
              gateways={gateways}
              value={gateway}
              onChange={setGateway}
            />

            {!fixedApplication && applicationsError && (
              <Alert
                variant="warning"
                isInline
                title={t("agentic.workflowRuns.failedLoadApplicationsTitle")}
              >
                {t("agentic.workflowRuns.failedLoadApplicationsBody", {
                  error: applicationsError,
                })}
              </Alert>
            )}

            {fixedApplication ? (
              <FormGroup
                label={t("terms.application")}
                fieldId="create-pb-application"
              >
                <span id="create-pb-application">
                  {t("agentic.workflowRuns.applicationOption", {
                    name: fixedApplication.name,
                    id: fixedApplication.id,
                  })}
                </span>
              </FormGroup>
            ) : (
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
                    label={t("agentic.workflowRuns.noApplicationOption")}
                  />
                  {applications.map((a) => (
                    <FormSelectOption
                      key={a.id}
                      value={applicationLabelValue(a)}
                      label={t("agentic.workflowRuns.applicationOption", {
                        name: a.name,
                        id: a.id,
                      })}
                    />
                  ))}
                </FormSelect>
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem>
                      {t("agentic.workflowRuns.applicationHelper")}
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              </FormGroup>
            )}

            {repoMissing && (
              <Alert
                variant="danger"
                isInline
                title={t("agentic.workflowRuns.noRepositoryTitle")}
              >
                {t("agentic.workflowRuns.noRepositoryBody", {
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
                        ? t("agentic.workflowRuns.targetBranchInvalid")
                        : t("agentic.workflowRuns.targetBranchHelper")}
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              </FormGroup>
            )}

            {workflowParams.length > 0 && (
              <FormSection title={t("agentic.workflowRuns.workflowParameters")}>
                {workflowParams.map((p) => {
                  const helper = paramHelperText(p);
                  const invalidReason = paramValueInvalidReason(
                    p,
                    paramValues[p.name] ?? ""
                  );
                  return (
                    <FormGroup
                      key={p.name}
                      label={p.name}
                      isRequired={p.required}
                      fieldId={`workflow-param-${p.name}`}
                    >
                      <ParamValueField
                        id={`workflow-param-${p.name}`}
                        param={p}
                        value={paramValues[p.name] ?? ""}
                        onChange={(v) =>
                          setParamValues((prev) => ({
                            ...prev,
                            [p.name]: v,
                          }))
                        }
                      />
                      {(helper || invalidReason) && (
                        <FormHelperText>
                          <HelperText>
                            {invalidReason && (
                              <HelperTextItem variant="error">
                                {invalidReason}
                              </HelperTextItem>
                            )}
                            {helper && (
                              <HelperTextItem>{helper}</HelperTextItem>
                            )}
                          </HelperText>
                        </FormHelperText>
                      )}
                    </FormGroup>
                  );
                })}
              </FormSection>
            )}

            {agentParams.length > 0 && (
              <FormSection title={t("agentic.workflowRuns.agentParameters")}>
                {agentParams.map((p) => {
                  const declaringStages = (stageAgents ?? [])
                    .filter((a) =>
                      (a.spec.params ?? []).some((q) => q.name === p.name)
                    )
                    .map((a) => a.metadata.name ?? unnamedLabel);
                  const helper = paramHelperText(p);
                  const invalidReason = paramValueInvalidReason(
                    p,
                    paramValues[p.name] ?? ""
                  );
                  return (
                    <FormGroup
                      key={p.name}
                      label={p.name}
                      isRequired={p.required}
                      fieldId={`agent-param-${p.name}`}
                    >
                      <ParamValueField
                        id={`agent-param-${p.name}`}
                        param={p}
                        value={paramValues[p.name] ?? ""}
                        onChange={(v) =>
                          setParamValues((prev) => ({
                            ...prev,
                            [p.name]: v,
                          }))
                        }
                      />
                      <FormHelperText>
                        <HelperText>
                          <HelperTextItem>
                            {t("agentic.workflowRuns.paramStages", {
                              stages: declaringStages.join(", "),
                            })}
                          </HelperTextItem>
                          {invalidReason && (
                            <HelperTextItem variant="error">
                              {invalidReason}
                            </HelperTextItem>
                          )}
                          {helper && <HelperTextItem>{helper}</HelperTextItem>}
                        </HelperText>
                      </FormHelperText>
                    </FormGroup>
                  );
                })}
              </FormSection>
            )}
          </Form>
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          id="create-workflow-run-submit"
          variant="primary"
          isDisabled={!canCreate}
          isLoading={submitting}
          onClick={submit}
        >
          {t("actions.create")}
        </Button>
        <Button
          id="create-workflow-run-cancel"
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
