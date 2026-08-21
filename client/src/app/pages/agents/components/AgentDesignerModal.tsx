import React, { useState } from "react";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Button,
  Checkbox,
  Form,
  FormGroup,
  FormHelperText,
  FormSelect,
  FormSelectOption,
  HelperText,
  HelperTextItem,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextArea,
  TextInput,
  Tooltip,
} from "@patternfly/react-core";

import type {
  AgentParam,
  AgentParamType,
  AgentResource,
  AgentResourceSpec,
} from "@app/api/agentic/contract";
import {
  BUILTIN_AGENT_IMAGES,
  RESOURCE_NAME_PATTERN,
} from "@app/api/agentic/contract";
import { ReadyLabel } from "@app/pages/agent-runs/components/ReadyLabel";
import {
  SkillDescription,
  SkillTypeLabel,
} from "@app/pages/skills/components/SkillLabels";
import { useFetchGateways } from "@app/queries/agentic-catalog";
import {
  useCreateAgentMutation,
  useUpdateAgentMutation,
} from "@app/queries/agents";
import {
  useFetchSkillCards,
  useFetchSkillCollections,
} from "@app/queries/skills";
import { getAxiosErrorMessage } from "@app/utils/utils";

const PARAM_TYPES: AgentParamType[] = ["string", "number", "boolean"];

/** Checkbox label row: name, secondary text and status labels on one line. */
const inlineLabelStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const secondaryTextStyle: React.CSSProperties = {
  fontSize: "0.85em",
  color: "var(--pf-t--global--text--color--subtle)",
};

interface ParamRow {
  name: string;
  type: AgentParamType;
  description: string;
  defaultValue: string;
  required: boolean;
}

function emptyParamRow(): ParamRow {
  return {
    name: "",
    type: "string",
    description: "",
    defaultValue: "",
    required: false,
  };
}

interface Props {
  existing?: AgentResource;
  onClose: () => void;
  onSaved: () => void;
}

export const AgentDesignerModal: React.FC<Props> = ({
  existing,
  onClose,
  onSaved,
}) => {
  const { t } = useTranslation();
  const isEdit = !!existing;

  // ---- catalog data
  const { gateways } = useFetchGateways();
  const { skillCards } = useFetchSkillCards();
  const { skillCollections } = useFetchSkillCollections();

  // ---- form state
  const [name, setName] = useState(existing?.metadata.name ?? "");
  const [imageRef, setImageRef] = useState(existing?.spec.image ?? "");
  const [prompt, setPrompt] = useState(existing?.spec.prompt ?? "");
  const [selectedGateways, setSelectedGateways] = useState<string[]>(
    existing?.spec.gateways?.map((g) => g.ref) ?? []
  );
  const [selectedSkillCards, setSelectedSkillCards] = useState<string[]>(
    existing?.spec.skillCards?.map((s) => s.ref) ?? []
  );
  const [selectedSkillCollections, setSelectedSkillCollections] = useState<
    string[]
  >(existing?.spec.skillCollections?.map((s) => s.ref) ?? []);
  const [params, setParams] = useState<ParamRow[]>(
    existing?.spec.params?.map((p) => ({
      name: p.name,
      type: p.type ?? "string",
      description: p.description ?? "",
      defaultValue: p.default ?? "",
      required: p.required ?? false,
    })) ?? []
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ---- mutations
  const createMutation = useCreateAgentMutation(
    () => onSaved(),
    (err: AxiosError) => setSubmitError(getAxiosErrorMessage(err))
  );
  const updateMutation = useUpdateAgentMutation(
    () => onSaved(),
    (err: AxiosError) => setSubmitError(getAxiosErrorMessage(err))
  );

  // ---- validation
  const nameValid = RESOURCE_NAME_PATTERN.test(name) && name.length > 0;
  const imageValid = imageRef.trim().length > 0;

  // ---- skill summary: rules (always injected) vs on-demand skills among the
  // selected cards. A selected ref whose card is not in the catalog counts as
  // a skill, which is the CRD default for `spec.type`.
  const ruleCount = skillCards.filter(
    (sc) =>
      sc.spec.type === "rule" && selectedSkillCards.includes(sc.metadata.name!)
  ).length;
  const onDemandCount = selectedSkillCards.length - ruleCount;

  // ---- helpers
  const toggleGateway = (ref: string) => {
    setSelectedGateways((prev) =>
      prev.includes(ref) ? prev.filter((r) => r !== ref) : [...prev, ref]
    );
  };

  const toggleSkillCard = (ref: string) => {
    setSelectedSkillCards((prev) =>
      prev.includes(ref) ? prev.filter((r) => r !== ref) : [...prev, ref]
    );
  };

  const toggleSkillCollection = (ref: string) => {
    setSelectedSkillCollections((prev) =>
      prev.includes(ref) ? prev.filter((r) => r !== ref) : [...prev, ref]
    );
  };

  const updateParam = (index: number, patch: Partial<ParamRow>) => {
    setParams((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p;
        const updated = { ...p, ...patch };
        // CEL rule: setting a default disables required
        if (patch.defaultValue !== undefined && patch.defaultValue !== "") {
          updated.required = false;
        }
        return updated;
      })
    );
  };

  const removeParam = (index: number) => {
    setParams((prev) => prev.filter((_, i) => i !== index));
  };

  // ---- submit
  const handleSubmit = () => {
    setSubmitError(null);

    const agentParams: AgentParam[] = params
      .filter((p) => p.name.trim() !== "")
      .map((p) => {
        const param: AgentParam = { name: p.name };
        if (p.type !== "string") param.type = p.type;
        if (p.description) param.description = p.description;
        if (p.defaultValue) param.default = p.defaultValue;
        if (p.required) param.required = true;
        return param;
      });

    const spec: AgentResourceSpec = {
      image: imageRef.trim(),
      ...(prompt.trim() && { prompt: prompt.trim() }),
      ...(selectedGateways.length > 0 && {
        gateways: selectedGateways.map((ref) => ({ ref })),
      }),
      ...(selectedSkillCards.length > 0 && {
        skillCards: selectedSkillCards.map((ref) => ({ ref })),
      }),
      ...(selectedSkillCollections.length > 0 && {
        skillCollections: selectedSkillCollections.map((ref) => ({ ref })),
      }),
      ...(agentParams.length > 0 && { params: agentParams }),
    };

    if (isEdit) {
      updateMutation.mutate({ name, spec });
    } else {
      createMutation.mutate({ name, spec });
    }
  };

  const isSaving = createMutation.isLoading || updateMutation.isLoading;
  const canSubmit = nameValid && imageValid && !isSaving;

  return (
    <Modal variant="large" isOpen onClose={onClose}>
      <ModalHeader
        title={
          isEdit
            ? t("agentic.agents.editAgentTitle", { name })
            : t("agentic.agents.createAgent")
        }
      />
      <ModalBody>
        <Form>
          {/* ---------- Name ---------- */}
          <FormGroup label={t("terms.name")} isRequired fieldId="agent-name">
            <TextInput
              id="agent-name"
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
                  {t("agentic.agents.nameHelper")}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>

          {/* ---------- Image ---------- */}
          <FormGroup label={t("terms.image")} isRequired fieldId="agent-image">
            <TextInput
              id="agent-image"
              isRequired
              list="agent-image-suggestions"
              value={imageRef}
              onChange={(_e, v) => setImageRef(v)}
              placeholder={t("agentic.agents.customImagePlaceholder")}
            />
            {/* Built-in suggestions via native datalist — the hub has no
                image-catalog endpoint, so this list only assists; any
                image ref the user types is valid. */}
            <datalist id="agent-image-suggestions">
              {BUILTIN_AGENT_IMAGES.map((img) => (
                <option key={img} value={img} />
              ))}
            </datalist>
          </FormGroup>

          {/* ---------- Prompt ---------- */}
          <FormGroup label={t("agentic.agents.prompt")} fieldId="agent-prompt">
            <TextArea
              id="agent-prompt"
              value={prompt}
              onChange={(_e, v) => setPrompt(v)}
              rows={4}
              resizeOrientation="vertical"
            />
          </FormGroup>

          {/* ---------- Gateways ---------- */}
          <FormGroup
            label={t("agentic.agents.gateways")}
            fieldId="agent-gateways"
          >
            {gateways.length === 0 ? (
              <HelperText>
                <HelperTextItem>
                  {t("composed.noDataStateTitle", {
                    what: t("agentic.agents.gateways").toLowerCase(),
                  })}
                </HelperTextItem>
              </HelperText>
            ) : (
              gateways.map((gw) => {
                const ref = gw.metadata.name!;
                return (
                  <div key={ref} style={{ marginBottom: 4 }}>
                    <Checkbox
                      id={`gw-${ref}`}
                      label={
                        <>
                          {ref}
                          <span
                            style={{
                              marginLeft: 8,
                              fontSize: "0.85em",
                              color: "var(--pf-t--global--color--200)",
                            }}
                          >
                            {gw.spec.model.name} ({gw.spec.provider})
                          </span>
                        </>
                      }
                      isChecked={selectedGateways.includes(ref)}
                      onChange={() => toggleGateway(ref)}
                    />
                  </div>
                );
              })
            )}
          </FormGroup>

          {/* ---------- Skill Cards ---------- */}
          <FormGroup label={t("terms.skillCards")} fieldId="agent-skill-cards">
            {skillCards.length === 0 ? (
              <HelperText>
                <HelperTextItem>
                  {t("composed.noDataStateTitle", {
                    what: t("terms.skillCards").toLowerCase(),
                  })}
                </HelperTextItem>
              </HelperText>
            ) : (
              skillCards.map((sc) => {
                const ref = sc.metadata.name!;
                const displayName = sc.spec.displayName?.trim();
                const description = sc.spec.description?.trim();
                return (
                  <div key={ref} style={{ marginBottom: 4 }}>
                    <Checkbox
                      id={`sc-${ref}`}
                      label={
                        <span style={inlineLabelStyle}>
                          <span>{displayName || ref}</span>
                          {displayName && displayName !== ref && (
                            <span style={secondaryTextStyle}>{ref}</span>
                          )}
                          <SkillTypeLabel type={sc.spec.type} isCompact />
                          <ReadyLabel conditions={sc.status?.conditions} />
                        </span>
                      }
                      description={
                        description ? (
                          <SkillDescription text={description} max={100} />
                        ) : undefined
                      }
                      isChecked={selectedSkillCards.includes(ref)}
                      onChange={() => toggleSkillCard(ref)}
                    />
                  </div>
                );
              })
            )}
          </FormGroup>

          {/* ---------- Skill Collections ---------- */}
          <FormGroup
            label={t("terms.skillCollections")}
            fieldId="agent-skill-collections"
          >
            {skillCollections.length === 0 ? (
              <HelperText>
                <HelperTextItem>
                  {t("composed.noDataStateTitle", {
                    what: t("terms.skillCollections").toLowerCase(),
                  })}
                </HelperTextItem>
              </HelperText>
            ) : (
              skillCollections.map((col) => {
                const ref = col.metadata.name!;
                // Enumerate mode (spec.image) vs an explicit member list.
                const memberNames = col.spec.skills?.map((s) => s.name) ?? [];
                const tooltipLines = col.spec.image
                  ? [col.spec.image]
                  : memberNames;
                const modeLabel = (
                  <Label isCompact variant="outline">
                    {col.spec.image
                      ? t("agentic.agents.collectionEnumerated")
                      : t("agentic.agents.collectionSkillCount", {
                          count: memberNames.length,
                        })}
                  </Label>
                );
                return (
                  <div key={ref} style={{ marginBottom: 4 }}>
                    <Checkbox
                      id={`col-${ref}`}
                      label={
                        <span style={inlineLabelStyle}>
                          <span>{ref}</span>
                          {tooltipLines.length > 0 ? (
                            <Tooltip
                              content={
                                <div style={{ wordBreak: "break-all" }}>
                                  {tooltipLines.map((line) => (
                                    <div key={line}>{line}</div>
                                  ))}
                                </div>
                              }
                            >
                              {modeLabel}
                            </Tooltip>
                          ) : (
                            modeLabel
                          )}
                          <ReadyLabel conditions={col.status?.conditions} />
                        </span>
                      }
                      isChecked={selectedSkillCollections.includes(ref)}
                      onChange={() => toggleSkillCollection(ref)}
                    />
                  </div>
                );
              })
            )}
          </FormGroup>

          {/* ---------- Skill summary ---------- */}
          {/* Skills are optional on an Agent, so this is guidance, not an
              error: what the selection loads always vs on demand. */}
          <HelperText>
            <HelperTextItem>
              {t("agentic.agents.skillSummary", {
                rules: ruleCount,
                skills: onDemandCount,
                collections: selectedSkillCollections.length,
              })}
            </HelperTextItem>
            <HelperTextItem>
              {t("agentic.agents.skillsGuidance")}
            </HelperTextItem>
          </HelperText>

          {/* ---------- Parameters ---------- */}
          <FormGroup label={t("terms.parameters")} fieldId="agent-params">
            {params.map((p, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                  marginBottom: 8,
                }}
              >
                <TextInput
                  aria-label={t("agentic.agents.paramName")}
                  placeholder={t("terms.name").toLowerCase()}
                  value={p.name}
                  onChange={(_e, v) => updateParam(idx, { name: v })}
                  style={{ flex: "1 1 120px" }}
                />
                <FormSelect
                  aria-label={t("agentic.agents.paramType")}
                  value={p.type}
                  onChange={(_e, v) =>
                    updateParam(idx, { type: v as AgentParamType })
                  }
                  style={{ flex: "0 0 100px" }}
                >
                  {PARAM_TYPES.map((t) => (
                    <FormSelectOption key={t} value={t} label={t} />
                  ))}
                </FormSelect>
                <TextInput
                  aria-label={t("terms.description")}
                  placeholder={t("terms.description").toLowerCase()}
                  value={p.description}
                  onChange={(_e, v) => updateParam(idx, { description: v })}
                  style={{ flex: "2 1 160px" }}
                />
                <TextInput
                  aria-label={t("agentic.agents.default")}
                  placeholder={t("agentic.agents.default").toLowerCase()}
                  value={p.defaultValue}
                  onChange={(_e, v) => updateParam(idx, { defaultValue: v })}
                  style={{ flex: "1 1 100px" }}
                />
                <Checkbox
                  id={`param-req-${idx}`}
                  label={t("agentic.agents.required")}
                  isChecked={p.required}
                  isDisabled={p.defaultValue !== ""}
                  onChange={(_e, checked) =>
                    updateParam(idx, { required: checked })
                  }
                  style={{ flex: "0 0 auto", marginTop: 6 }}
                />
                <Button
                  variant="plain"
                  aria-label={t("agentic.agents.removeParameter")}
                  onClick={() => removeParam(idx)}
                  style={{ flex: "0 0 auto" }}
                >
                  &times;
                </Button>
              </div>
            ))}
            <Button
              variant="link"
              size="sm"
              onClick={() => setParams((prev) => [...prev, emptyParamRow()])}
              style={{ paddingLeft: 0 }}
            >
              + {t("agentic.agents.addParameter")}
            </Button>
          </FormGroup>

          {submitError && (
            <Alert
              variant="danger"
              isInline
              title={t("agentic.agents.saveFailed")}
              style={{ marginTop: "0.5rem" }}
            >
              {submitError}
            </Alert>
          )}
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          isLoading={isSaving}
          isDisabled={!canSubmit}
          onClick={handleSubmit}
        >
          {isEdit ? t("actions.save") : t("actions.create")}
        </Button>
        <Button variant="link" onClick={onClose}>
          {t("actions.cancel")}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
