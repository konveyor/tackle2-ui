import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
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
  TextArea,
  TextInput,
} from "@patternfly/react-core";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  PlusCircleIcon,
  TrashIcon,
} from "@patternfly/react-icons";

import type {
  AgentResource,
  AgentWorkload,
  AgentWorkloadSpec,
  AgentWorkloadStage,
} from "@app/api/agentic/contract";
import {
  RESOURCE_NAME_PATTERN,
  STAGE_NAME_PATTERN,
} from "@app/api/agentic/contract";
import { useFetchAgents } from "@app/queries/agents";
import {
  useCreateWorkloadMutation,
  useUpdateWorkloadMutation,
} from "@app/queries/workloads";
import { getAxiosErrorMessage } from "@app/utils/utils";

interface StageFormData {
  key: number;
  name: string;
  agentRef: string;
  instructions: string;
}

let nextStageKey = 1;

function emptyStage(agents: AgentResource[]): StageFormData {
  return {
    key: nextStageKey++,
    name: "",
    agentRef: agents.length > 0 ? (agents[0]!.metadata.name ?? "") : "",
    instructions: "",
  };
}

function stagesToFormData(stages: AgentWorkloadStage[]): StageFormData[] {
  return stages.map((s) => ({
    key: nextStageKey++,
    name: s.name,
    agentRef: s.agentRef,
    instructions: s.instructions ?? "",
  }));
}

function firstProviderRef(
  agentName: string,
  agents: AgentResource[]
): string | undefined {
  const agent = agents.find((a) => a.metadata.name === agentName);
  return agent?.spec.providers?.[0]?.ref;
}

// Returns the comma-joined provider names when stages span more than one
// LLM provider, otherwise null. The caller renders the warning copy.
function detectProviderOverlap(
  stages: StageFormData[],
  agents: AgentResource[]
): string | null {
  const seen = new Set<string>();
  for (const stage of stages) {
    const ref = firstProviderRef(stage.agentRef, agents);
    if (ref) seen.add(ref);
  }
  return seen.size > 1 ? Array.from(seen).join(", ") : null;
}

interface WorkloadComposerModalProps {
  existing?: AgentWorkload;
  onClose: () => void;
  onSaved: () => void;
}

export const WorkloadComposerModal: React.FC<WorkloadComposerModalProps> = ({
  existing,
  onClose,
  onSaved,
}) => {
  const { t } = useTranslation();
  const isEdit = !!existing;
  const { agents } = useFetchAgents();

  const [name, setName] = useState(existing?.metadata.name ?? "");
  const [guide, setGuide] = useState(existing?.spec.guide ?? "");
  const [stages, setStages] = useState<StageFormData[]>(
    existing?.spec.stages?.length
      ? stagesToFormData(existing.spec.stages)
      : [emptyStage(agents)]
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  // A stage row built before the agent list arrived holds agentRef: "", while
  // the FormSelect below displays the first agent. Resolve the same fallback
  // everywhere it matters — display, validity, and submit — so what the user
  // sees selected is what gets sent.
  const resolveAgentRef = (ref: string) =>
    ref || (agents[0]?.metadata.name ?? "");

  const createMutation = useCreateWorkloadMutation(
    () => onSaved(),
    (err) => setSubmitError(getAxiosErrorMessage(err))
  );
  const updateMutation = useUpdateWorkloadMutation(
    () => onSaved(),
    (err) => setSubmitError(getAxiosErrorMessage(err))
  );

  const submitting = createMutation.isLoading || updateMutation.isLoading;

  // --- Validation ---

  const nameValid = RESOURCE_NAME_PATTERN.test(name);
  const stageNameErrors: Record<number, string | null> = {};
  const seenStageNames = new Set<string>();
  for (const s of stages) {
    if (!s.name.trim()) {
      stageNameErrors[s.key] = t("agentic.workloads.stageNameRequired");
    } else if (!STAGE_NAME_PATTERN.test(s.name)) {
      stageNameErrors[s.key] = t("agentic.workloads.stageNamePattern");
    } else if (seenStageNames.has(s.name)) {
      stageNameErrors[s.key] = t("agentic.workloads.stageNameDuplicate");
    } else {
      stageNameErrors[s.key] = null;
    }
    seenStageNames.add(s.name);
  }

  const hasStageErrors = Object.values(stageNameErrors).some((e) => e !== null);
  const canSubmit =
    nameValid &&
    name.trim().length > 0 &&
    stages.length > 0 &&
    !hasStageErrors &&
    stages.every((s) => resolveAgentRef(s.agentRef)) &&
    !submitting;

  const overlappingProviders = detectProviderOverlap(
    stages.map((s) => ({ ...s, agentRef: resolveAgentRef(s.agentRef) })),
    agents
  );

  // --- Stage manipulation ---

  const updateStage = (key: number, patch: Partial<StageFormData>) => {
    setStages((prev) =>
      prev.map((s) => (s.key === key ? { ...s, ...patch } : s))
    );
  };

  const removeStage = (key: number) => {
    setStages((prev) => prev.filter((s) => s.key !== key));
  };

  const moveStage = (index: number, direction: -1 | 1) => {
    setStages((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  };

  const addStage = () => {
    setStages((prev) => [...prev, emptyStage(agents)]);
  };

  // --- Submit ---

  const submit = () => {
    setSubmitError(null);
    const spec: AgentWorkloadSpec = {
      guide: guide.trim() || undefined,
      stages: stages.map(
        (s): AgentWorkloadStage => ({
          name: s.name,
          agentRef: resolveAgentRef(s.agentRef),
          instructions: s.instructions.trim() || undefined,
        })
      ),
    };
    if (isEdit) {
      updateMutation.mutate({ name, spec });
    } else {
      createMutation.mutate({ name, spec });
    }
  };

  return (
    <Modal
      variant={ModalVariant.large}
      isOpen
      onClose={() => {
        if (!submitting) onClose();
      }}
    >
      <ModalHeader
        title={
          isEdit
            ? t("agentic.workloads.editWorkloadTitle", { name })
            : t("agentic.workloads.createWorkload")
        }
      />
      <ModalBody>
        {submitError && (
          <Alert
            variant="danger"
            isInline
            title={
              isEdit
                ? t("agentic.workloads.updateFailed")
                : t("agentic.workloads.createFailed")
            }
            style={{ marginBottom: "1rem" }}
          >
            {submitError}
          </Alert>
        )}

        <Form
          id="workload-composer-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) submit();
          }}
        >
          <FormGroup label={t("terms.name")} isRequired fieldId="pb-name">
            <TextInput
              id="pb-name"
              isRequired
              isDisabled={isEdit}
              value={name}
              onChange={(_e, v) => setName(v)}
              validated={
                name.length === 0 ? "default" : nameValid ? "success" : "error"
              }
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem
                  variant={name.length > 0 && !nameValid ? "error" : "default"}
                >
                  {t("agentic.workloads.nameHelper")}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>

          <FormGroup label={t("agentic.workloads.guide")} fieldId="pb-guide">
            <TextArea
              id="pb-guide"
              value={guide}
              onChange={(_e, v) => setGuide(v)}
              rows={3}
              resizeOrientation="vertical"
              placeholder={t("agentic.workloads.guidePlaceholder")}
            />
          </FormGroup>

          <Alert
            variant="info"
            isInline
            isPlain
            title={t("agentic.workloads.artifactChainingTitle")}
            style={{ marginBottom: "1rem" }}
          >
            {t("agentic.workloads.artifactChainingBody")}
          </Alert>

          {overlappingProviders && (
            <Alert
              variant="warning"
              isInline
              title={t("agentic.workloads.providerOverlapTitle")}
              style={{ marginBottom: "1rem" }}
            >
              {t("agentic.workloads.providerOverlapWarning", {
                providers: overlappingProviders,
              })}
            </Alert>
          )}

          <Content component="h3" style={{ marginBottom: "0.5rem" }}>
            {t("terms.stages")}
          </Content>

          {stages.map((stage, index) => (
            <Card
              key={stage.key}
              isCompact
              style={{
                marginBottom: "1rem",
                border: "1px solid var(--pf-t--global--border--color--default)",
              }}
            >
              <CardHeader
                actions={{
                  actions: (
                    <>
                      <Button
                        variant="plain"
                        aria-label={t("agentic.workloads.moveStageUp")}
                        isDisabled={index === 0}
                        onClick={() => moveStage(index, -1)}
                        size="sm"
                      >
                        <ArrowUpIcon />
                      </Button>
                      <Button
                        variant="plain"
                        aria-label={t("agentic.workloads.moveStageDown")}
                        isDisabled={index === stages.length - 1}
                        onClick={() => moveStage(index, 1)}
                        size="sm"
                      >
                        <ArrowDownIcon />
                      </Button>
                      <Button
                        variant="plain"
                        aria-label={t("agentic.workloads.removeStage")}
                        isDanger
                        onClick={() => removeStage(stage.key)}
                        size="sm"
                      >
                        <TrashIcon />
                      </Button>
                    </>
                  ),
                  hasNoOffset: true,
                }}
              >
                <CardTitle>{`${t("terms.stage")} ${index + 1}`}</CardTitle>
              </CardHeader>
              <CardBody>
                <FormGroup
                  label={t("agentic.workloads.stageName")}
                  isRequired
                  fieldId={`stage-name-${stage.key}`}
                >
                  <TextInput
                    id={`stage-name-${stage.key}`}
                    isRequired
                    value={stage.name}
                    onChange={(_e, v) => updateStage(stage.key, { name: v })}
                    validated={
                      stage.name.length === 0
                        ? "default"
                        : stageNameErrors[stage.key]
                          ? "error"
                          : "success"
                    }
                  />
                  {stageNameErrors[stage.key] && (
                    <FormHelperText>
                      <HelperText>
                        <HelperTextItem variant="error">
                          {stageNameErrors[stage.key]}
                        </HelperTextItem>
                      </HelperText>
                    </FormHelperText>
                  )}
                </FormGroup>

                <FormGroup
                  label={t("terms.agent")}
                  isRequired
                  fieldId={`stage-agent-${stage.key}`}
                >
                  <FormSelect
                    id={`stage-agent-${stage.key}`}
                    value={resolveAgentRef(stage.agentRef)}
                    onChange={(_e, v) =>
                      updateStage(stage.key, { agentRef: v })
                    }
                  >
                    {agents.length === 0 && (
                      <FormSelectOption
                        value=""
                        label={t("agentic.workloads.noAgentsAvailable")}
                        isDisabled
                      />
                    )}
                    {agents.map((a) => (
                      <FormSelectOption
                        key={a.metadata.name}
                        value={a.metadata.name}
                        label={
                          a.metadata.name ?? t("agentic.workloads.unnamed")
                        }
                      />
                    ))}
                  </FormSelect>
                </FormGroup>

                <FormGroup
                  label={t("terms.instructions")}
                  fieldId={`stage-instructions-${stage.key}`}
                >
                  <TextArea
                    id={`stage-instructions-${stage.key}`}
                    value={stage.instructions}
                    onChange={(_e, v) =>
                      updateStage(stage.key, { instructions: v })
                    }
                    rows={3}
                    resizeOrientation="vertical"
                    placeholder={t("agentic.workloads.instructionsPlaceholder")}
                  />
                </FormGroup>
              </CardBody>
            </Card>
          ))}

          <Button variant="link" icon={<PlusCircleIcon />} onClick={addStage}>
            {t("agentic.workloads.addStage")}
          </Button>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          isDisabled={!canSubmit}
          isLoading={submitting}
          onClick={submit}
        >
          {isEdit ? t("actions.save") : t("actions.create")}
        </Button>
        <Button variant="link" isDisabled={submitting} onClick={onClose}>
          {t("actions.cancel")}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
