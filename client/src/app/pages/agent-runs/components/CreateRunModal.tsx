import React, { useState } from "react";
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
  TextArea,
  TextInput,
} from "@patternfly/react-core";

import type { AgentResource } from "@app/api/agentic/contract";
import {
  CREDENTIAL_SOURCES_ANNOTATION,
  MANAGED_LABEL,
  SOURCE_APPLICATION_IDENTITY,
  SOURCE_APPLICATION_REPOSITORY_BRANCH,
  SOURCE_APPLICATION_REPOSITORY_URL,
  defaultTargetBranch,
  parseSourcesAnnotation,
} from "@app/api/agentic/contract";
import type { Application } from "@app/api/models";
import {
  GatewayPicker,
  defaultGatewayFor,
} from "@app/pages/agent-runs/components/GatewayPicker";
import { paramHelperText } from "@app/pages/agent-runs/components/ParamFields";
import { useCreateAgentRunMutation } from "@app/queries/agent-runs";
import { useFetchGateways } from "@app/queries/agentic-catalog";
import { useFetchAgents } from "@app/queries/agents";
import { useFetchApplications } from "@app/queries/applications";
import {
  applicationLabelValue,
  targetBranchBlocker,
  truncate,
} from "@app/utils/agentic";
import { getAxiosErrorMessage } from "@app/utils/utils";

const PARAM_SOURCE_LABEL_KEYS: Record<string, string> = {
  [SOURCE_APPLICATION_REPOSITORY_URL]:
    "agentic.createRun.sourceApplicationRepositoryUrl",
  [SOURCE_APPLICATION_REPOSITORY_BRANCH]:
    "agentic.createRun.sourceApplicationRepositoryBranch",
};

const CREDENTIAL_SOURCE_LABELS: Record<string, string> = {
  [SOURCE_APPLICATION_IDENTITY]: "application identity",
};

const isRecognizedParamSource = (source: string | undefined): boolean =>
  source !== undefined &&
  Object.prototype.hasOwnProperty.call(PARAM_SOURCE_LABEL_KEYS, source);

const isRecognizedCredentialSource = (source: string): boolean =>
  Object.prototype.hasOwnProperty.call(CREDENTIAL_SOURCE_LABELS, source);

function previewValue(
  source: string,
  app: Application | undefined
): string | undefined {
  if (!app) return undefined;
  if (source === SOURCE_APPLICATION_REPOSITORY_URL) return app.repository?.url;
  if (source === SOURCE_APPLICATION_REPOSITORY_BRANCH)
    return app.repository?.branch;
  return undefined;
}

function defaultsFor(agent: AgentResource | undefined): Record<string, string> {
  const values: Record<string, string> = {};
  for (const p of agent?.spec.params ?? []) {
    values[p.name] = p.default ?? "";
  }
  return values;
}

interface CreateRunModalProps {
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

export const CreateRunModal: React.FC<CreateRunModalProps> = ({
  application: fixedApplication,
  onClose,
  onCreated,
}) => {
  const { t } = useTranslation();
  const [agentName, setAgentName] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [gateway, setGateway] = useState<string | undefined>(undefined);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [instructions, setInstructions] = useState("");
  const [targetBranch, setTargetBranch] = useState(() => defaultTargetBranch());
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    agents,
    isLoading: agentsLoading,
    fetchError: agentsFetchError,
  } = useFetchAgents();
  const agentsError = agentsFetchError
    ? getAxiosErrorMessage(agentsFetchError)
    : null;

  const { data: applications, error: applicationsFetchError } =
    useFetchApplications();
  const applicationsError = applicationsFetchError
    ? getAxiosErrorMessage(applicationsFetchError)
    : null;

  const { gateways } = useFetchGateways();

  // Seed the agent select + param/gateway defaults once the list arrives —
  // a render-phase adjustment (not an effect) so the settled state is
  // committed in one pass.
  const seedAgent = !agentName && agents.length > 0 ? agents[0] : undefined;
  if (seedAgent?.metadata.name) {
    setAgentName(seedAgent.metadata.name);
    setParamValues(defaultsFor(seedAgent));
    setGateway(defaultGatewayFor(seedAgent.spec.gateways ?? []));
  }

  const createRunMutation = useCreateAgentRunMutation(
    (created) => {
      const name = created.metadata.name;
      if (!name) {
        setSubmitError(t("agentic.createRun.createdRunMissingName"));
        return;
      }
      onCreated(name);
    },
    (err) => setSubmitError(getAxiosErrorMessage(err))
  );
  const submitting = createRunMutation.isLoading;

  const selected = agents.find((a) => a.metadata.name === agentName);

  const selectAgent = (name: string) => {
    const agent = agents.find((a) => a.metadata.name === name);
    setAgentName(name);
    setParamValues(defaultsFor(agent));
    setGateway(defaultGatewayFor(agent?.spec.gateways ?? []));
  };

  const paramSources = parseSourcesAnnotation(selected);
  const credentialSources = parseSourcesAnnotation(
    selected,
    CREDENTIAL_SOURCES_ANNOTATION
  );
  const allParams = selected?.spec.params ?? [];
  const userParams = allParams.filter(
    (p) => !isRecognizedParamSource(paramSources[p.name])
  );
  const platformParams = allParams.filter((p) =>
    isRecognizedParamSource(paramSources[p.name])
  );
  const platformCredentials = Object.entries(credentialSources).filter(
    ([, s]) => isRecognizedCredentialSource(s)
  );
  // Konveyor-managed agents hard-require Hub context at startup: a run
  // created without an application never comes up (the pod exits before
  // its ACP endpoint exists and the viewer only sees a DNS error), so
  // require an application even when the Agent declares no platform
  // param/credential sources.
  const isKonveyorManaged =
    selected?.metadata.labels?.[MANAGED_LABEL] === "true";
  // A caller that supplied an application means the run to be about it, so
  // send it even for an agent that declares no platform sources.
  const needsApplication =
    !!fixedApplication ||
    isKonveyorManaged ||
    platformParams.length > 0 ||
    platformCredentials.length > 0;
  const application =
    fixedApplication ??
    applications.find((a) => applicationLabelValue(a) === applicationId);

  const missingRequired = userParams.filter(
    (p) => p.required && !(paramValues[p.name] ?? "").trim()
  );
  const missingApplication = needsApplication && !application;
  const unresolvable = application
    ? platformParams.filter(
        (p) =>
          p.required &&
          !p.default &&
          !previewValue(paramSources[p.name], application)
      )
    : [];
  const branchBlocker =
    application && targetBranch.trim()
      ? targetBranchBlocker(application, targetBranch)
      : undefined;
  const branchInvalid =
    !!application && (!targetBranch.trim() || branchBlocker !== undefined);
  const canCreate =
    !!selected &&
    missingRequired.length === 0 &&
    !missingApplication &&
    !branchInvalid &&
    unresolvable.length === 0 &&
    !submitting;

  const submit = () => {
    if (!selected || !canCreate) return;
    setSubmitError(null);
    const params: Record<string, string> = {};
    for (const p of userParams) {
      const v = (paramValues[p.name] ?? "").trim();
      if (v) params[p.name] = v;
    }
    // Nothing downstream resolves annotated params anymore: the shim's
    // application path injects Hub coordinates as env (ADR 0005 create-time
    // resolution is retired), while the controller still rejects runs
    // missing required params. This client is therefore the create-time
    // resolver — it sends the values it previews from the application.
    for (const p of platformParams) {
      // `||`, not `??`: the Hub reports unset fields as empty strings.
      const v = previewValue(paramSources[p.name], application) || p.default;
      if (v) params[p.name] = v;
    }
    createRunMutation.mutate({
      agentRef: selected.metadata.name ?? agentName,
      params: Object.keys(params).length > 0 ? params : undefined,
      instructions: instructions.trim() || undefined,
      applicationRef:
        needsApplication && application
          ? applicationLabelValue(application)
          : undefined,
      targetBranch:
        needsApplication && application ? targetBranch.trim() : undefined,
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
      <ModalHeader title={t("agentic.createRun.title")} />
      <ModalBody>
        {agentsError && (
          <Alert
            variant="danger"
            isInline
            title={t("agentic.createRun.failedToLoadAgents")}
            style={{ marginBottom: "1rem" }}
          >
            {agentsError}
          </Alert>
        )}
        {submitError && (
          <Alert
            variant="danger"
            isInline
            title={t("agentic.createRun.createFailed")}
            style={{ marginBottom: "1rem" }}
          >
            {submitError}
          </Alert>
        )}
        {agentsLoading ? (
          <Spinner aria-label={t("agentic.createRun.loadingAgents")} />
        ) : !agentsError && agents.length === 0 ? (
          <Alert
            variant="warning"
            isInline
            title={t("agentic.createRun.noAgentsTitle")}
          >
            {t("agentic.createRun.noAgentsBody")}
          </Alert>
        ) : (
          <Form
            id="create-run-form"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <FormGroup
              label={t("terms.agent")}
              isRequired
              fieldId="create-agent"
            >
              <FormSelect
                id="create-agent"
                value={agentName}
                onChange={(_e, v) => selectAgent(v)}
              >
                {(agents ?? []).map((a) => (
                  <FormSelectOption
                    key={a.metadata.name}
                    value={a.metadata.name}
                    label={a.metadata.name ?? t("agentic.createRun.unnamed")}
                  />
                ))}
              </FormSelect>
              {selected?.spec.prompt && (
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem>
                      {truncate(selected.spec.prompt, 160)}
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              )}
            </FormGroup>

            <GatewayPicker
              gatewayRefs={selected?.spec.gateways ?? []}
              gateways={gateways}
              value={gateway}
              onChange={setGateway}
            />

            {!fixedApplication && needsApplication && applicationsError && (
              <Alert
                variant="danger"
                isInline
                title={t("agentic.createRun.failedToLoadApplications")}
              >
                {applicationsError} —{" "}
                {t("agentic.createRun.inventoryRequiredBody")}
              </Alert>
            )}

            {fixedApplication && (
              <FormGroup
                label={t("terms.application")}
                fieldId="create-application"
              >
                <span id="create-application">
                  {t("agentic.createRun.applicationOption", {
                    name: fixedApplication.name,
                    id: fixedApplication.id,
                  })}
                </span>
              </FormGroup>
            )}

            {!fixedApplication && needsApplication && (
              <FormGroup
                label={t("terms.application")}
                isRequired
                fieldId="create-application"
              >
                <FormSelect
                  id="create-application"
                  value={applicationId}
                  onChange={(_e, v) => setApplicationId(v)}
                >
                  <FormSelectOption
                    value=""
                    label={t("agentic.createRun.selectApplicationPlaceholder")}
                    isDisabled
                  />
                  {applications.map((a) => (
                    <FormSelectOption
                      key={a.id}
                      value={applicationLabelValue(a)}
                      label={t("agentic.createRun.applicationOption", {
                        name: a.name,
                        id: a.id,
                      })}
                    />
                  ))}
                </FormSelect>
              </FormGroup>
            )}

            {needsApplication && application && (
              <FormGroup
                label={t("terms.targetBranch")}
                isRequired
                fieldId="create-run-target-branch"
              >
                <TextInput
                  id="create-run-target-branch"
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
                        : t("agentic.bulkRun.targetBranchHelper")}
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              </FormGroup>
            )}

            {needsApplication && unresolvable.length > 0 && (
              <Alert
                variant="warning"
                isInline
                title={t("agentic.createRun.cannotSupplyInputs", {
                  name:
                    application?.name ?? t("agentic.createRun.thisApplication"),
                })}
              >
                {t("agentic.createRun.noValueFor", {
                  params: unresolvable.map((p) => p.name).join(", "),
                })}
              </Alert>
            )}

            {application && platformParams.length > 0 && (
              <HelperText>
                {platformParams.map((p) => {
                  const fromApp = previewValue(
                    paramSources[p.name],
                    application
                  );
                  const v = fromApp || p.default;
                  return v ? (
                    <HelperTextItem key={p.name}>
                      {t("agentic.createRun.paramFromSource", {
                        name: p.name,
                        source: fromApp
                          ? t(PARAM_SOURCE_LABEL_KEYS[paramSources[p.name]])
                          : t("agentic.createRun.agentDefault"),
                      })}{" "}
                      <code>{v}</code>
                    </HelperTextItem>
                  ) : null;
                })}
              </HelperText>
            )}

            {userParams.map((p) => {
              const helper = paramHelperText(p);
              return (
                <FormGroup
                  key={p.name}
                  label={p.name}
                  isRequired={p.required}
                  fieldId={`param-${p.name}`}
                >
                  <TextInput
                    id={`param-${p.name}`}
                    isRequired={p.required}
                    value={paramValues[p.name] ?? ""}
                    onChange={(_e, v) =>
                      setParamValues((prev) => ({ ...prev, [p.name]: v }))
                    }
                  />
                  {helper && (
                    <FormHelperText>
                      <HelperText>
                        <HelperTextItem>{helper}</HelperTextItem>
                      </HelperText>
                    </FormHelperText>
                  )}
                </FormGroup>
              );
            })}

            <FormGroup
              label={t("terms.instructions")}
              fieldId="create-instructions"
            >
              <TextArea
                id="create-instructions"
                value={instructions}
                onChange={(_e, v) => setInstructions(v)}
                rows={4}
                resizeOrientation="vertical"
                placeholder={t("agentic.createRun.instructionsPlaceholder")}
              />
            </FormGroup>
          </Form>
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          id="create-run-submit"
          variant="primary"
          isDisabled={!canCreate}
          isLoading={submitting}
          onClick={submit}
        >
          {t("actions.create")}
        </Button>
        <Button
          id="create-run-cancel"
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
