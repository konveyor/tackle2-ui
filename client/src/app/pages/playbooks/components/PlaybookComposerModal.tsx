import React, { useState } from "react";
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
  AgentPlaybook,
  AgentPlaybookSpec,
  AgentPlaybookStage,
  AgentResource,
} from "@app/api/agentic/contract";
import {
  RESOURCE_NAME_PATTERN,
  STAGE_NAME_PATTERN,
} from "@app/api/agentic/contract";
import {
  useCreatePlaybookMutation,
  useFetchAgents,
  useUpdatePlaybookMutation,
} from "@app/queries/agent-runs";

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

function stagesToFormData(stages: AgentPlaybookStage[]): StageFormData[] {
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

function detectProviderOverlap(
  stages: StageFormData[],
  agents: AgentResource[]
): string | null {
  const seen = new Set<string>();
  for (const stage of stages) {
    const ref = firstProviderRef(stage.agentRef, agents);
    if (ref) seen.add(ref);
  }
  if (seen.size > 1) {
    const names = Array.from(seen).join(", ");
    return `Stages reference different LLM providers (${names}). Verify each provider is configured and accessible.`;
  }
  return null;
}

interface PlaybookComposerModalProps {
  existing?: AgentPlaybook;
  onClose: () => void;
  onSaved: () => void;
}

export const PlaybookComposerModal: React.FC<PlaybookComposerModalProps> = ({
  existing,
  onClose,
  onSaved,
}) => {
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

  const createMutation = useCreatePlaybookMutation(
    () => onSaved(),
    (err) => setSubmitError(err.message)
  );
  const updateMutation = useUpdatePlaybookMutation(
    () => onSaved(),
    (err) => setSubmitError(err.message)
  );

  const submitting = createMutation.isLoading || updateMutation.isLoading;

  // --- Validation ---

  const nameValid = RESOURCE_NAME_PATTERN.test(name);
  const stageNameErrors: Record<number, string | null> = {};
  const seenStageNames = new Set<string>();
  for (const s of stages) {
    if (!s.name.trim()) {
      stageNameErrors[s.key] = "Stage name is required";
    } else if (!STAGE_NAME_PATTERN.test(s.name)) {
      stageNameErrors[s.key] =
        "Lowercase letters, digits, and hyphens only (must start with a letter)";
    } else if (seenStageNames.has(s.name)) {
      stageNameErrors[s.key] = "Duplicate stage name";
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
    stages.every((s) => s.agentRef) &&
    !submitting;

  const providerWarning = detectProviderOverlap(stages, agents);

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
    const spec: AgentPlaybookSpec = {
      guide: guide.trim() || undefined,
      stages: stages.map(
        (s): AgentPlaybookStage => ({
          name: s.name,
          agentRef: s.agentRef,
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
        title={isEdit ? `Edit playbook: ${name}` : "Create playbook"}
      />
      <ModalBody>
        {submitError && (
          <Alert
            variant="danger"
            isInline
            title={isEdit ? "Update failed" : "Create failed"}
            style={{ marginBottom: "1rem" }}
          >
            {submitError}
          </Alert>
        )}

        <Form
          id="playbook-composer-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) submit();
          }}
        >
          <FormGroup label="Name" isRequired fieldId="pb-name">
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
                  Lowercase alphanumeric, dots, and hyphens (e.g.
                  my-migration-playbook)
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>

          <FormGroup label="Guide" fieldId="pb-guide">
            <TextArea
              id="pb-guide"
              value={guide}
              onChange={(_e, v) => setGuide(v)}
              rows={3}
              resizeOrientation="vertical"
              placeholder="High-level guidance shared with every stage (optional)"
            />
          </FormGroup>

          <Alert
            variant="info"
            isInline
            isPlain
            title="Artifact chaining"
            style={{ marginBottom: "1rem" }}
          >
            Each stage commits its output to TARGET_BRANCH. The next
            stage&apos;s skill reads from the same branch.
          </Alert>

          {providerWarning && (
            <Alert
              variant="warning"
              isInline
              title="Provider overlap"
              style={{ marginBottom: "1rem" }}
            >
              {providerWarning}
            </Alert>
          )}

          <Content component="h3" style={{ marginBottom: "0.5rem" }}>
            Stages
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
                        aria-label="Move stage up"
                        isDisabled={index === 0}
                        onClick={() => moveStage(index, -1)}
                        size="sm"
                      >
                        <ArrowUpIcon />
                      </Button>
                      <Button
                        variant="plain"
                        aria-label="Move stage down"
                        isDisabled={index === stages.length - 1}
                        onClick={() => moveStage(index, 1)}
                        size="sm"
                      >
                        <ArrowDownIcon />
                      </Button>
                      <Button
                        variant="plain"
                        aria-label="Remove stage"
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
                <CardTitle>Stage {index + 1}</CardTitle>
              </CardHeader>
              <CardBody>
                <FormGroup
                  label="Stage name"
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
                  label="Agent"
                  isRequired
                  fieldId={`stage-agent-${stage.key}`}
                >
                  <FormSelect
                    id={`stage-agent-${stage.key}`}
                    value={stage.agentRef}
                    onChange={(_e, v) =>
                      updateStage(stage.key, { agentRef: v })
                    }
                  >
                    {agents.length === 0 && (
                      <FormSelectOption
                        value=""
                        label="No agents available"
                        isDisabled
                      />
                    )}
                    {agents.map((a) => (
                      <FormSelectOption
                        key={a.metadata.name}
                        value={a.metadata.name}
                        label={a.metadata.name ?? "(unnamed)"}
                      />
                    ))}
                  </FormSelect>
                </FormGroup>

                <FormGroup
                  label="Instructions"
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
                    placeholder="Stage-specific instructions (optional)"
                  />
                </FormGroup>
              </CardBody>
            </Card>
          ))}

          <Button variant="link" icon={<PlusCircleIcon />} onClick={addStage}>
            Add stage
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
          {isEdit ? "Save" : "Create"}
        </Button>
        <Button variant="link" isDisabled={submitting} onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};
