import React, { useState } from "react";
import { AxiosError } from "axios";
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
} from "@patternfly/react-core";

import type {
  AgentParam,
  AgentParamType,
  AgentResource,
  AgentResourceSpec,
} from "@app/api/agentic/contract";
import { RESOURCE_NAME_PATTERN } from "@app/api/agentic/contract";
import { ReadyLabel } from "@app/pages/agent-runs/components/sources";
import {
  useCreateAgentMutation,
  useFetchImagesWithSource,
  useFetchProviders,
  useFetchSkillCards,
  useFetchSkillCollections,
  useUpdateAgentMutation,
} from "@app/queries/agent-runs";

const PARAM_TYPES: AgentParamType[] = ["string", "number", "boolean"];

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
  const isEdit = !!existing;

  // ---- catalog data
  const { images } = useFetchImagesWithSource();
  const { providers } = useFetchProviders();
  const { skillCards } = useFetchSkillCards();
  const { skillCollections } = useFetchSkillCollections();

  // ---- form state
  const [name, setName] = useState(existing?.metadata.name ?? "");
  const [imageRef, setImageRef] = useState(existing?.spec.image ?? "");
  // Explicit dropdown/custom choice; null = auto-detect (custom when
  // editing an agent whose image is not in the loaded catalog).
  const [customImageOverride, setCustomImageOverride] = useState<
    boolean | null
  >(null);
  const [prompt, setPrompt] = useState(existing?.spec.prompt ?? "");
  const [selectedProviders, setSelectedProviders] = useState<string[]>(
    existing?.spec.providers?.map((p) => p.ref) ?? []
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

  // Derived, not effect-set: custom mode is the user's explicit choice,
  // else auto-detected on edit when the image is not in the catalog list.
  const customImage =
    customImageOverride ??
    (isEdit &&
      !!existing?.spec.image &&
      images.length > 0 &&
      !images.some((i) => i.image === existing.spec.image));

  // ---- mutations
  const createMutation = useCreateAgentMutation(
    () => onSaved(),
    (err: AxiosError) =>
      setSubmitError(
        err.response?.data ? String(err.response.data) : err.message
      )
  );
  const updateMutation = useUpdateAgentMutation(
    () => onSaved(),
    (err: AxiosError) =>
      setSubmitError(
        err.response?.data ? String(err.response.data) : err.message
      )
  );

  // ---- validation
  const nameValid = RESOURCE_NAME_PATTERN.test(name) && name.length > 0;
  const imageValid = imageRef.trim().length > 0;
  const totalSkills =
    selectedSkillCards.length + selectedSkillCollections.length;

  // ---- helpers
  const toggleProvider = (ref: string) => {
    setSelectedProviders((prev) =>
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
      ...(selectedProviders.length > 0 && {
        providers: selectedProviders.map((ref) => ({ ref })),
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
      <ModalHeader title={isEdit ? `Edit agent: ${name}` : "Create agent"} />
      <ModalBody>
        <Form>
          {/* ---------- Name ---------- */}
          <FormGroup label="Name" isRequired fieldId="agent-name">
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
                  DNS-1123 subdomain: lowercase alphanumeric, hyphens, dots
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>

          {/* ---------- Image ---------- */}
          <FormGroup label="Image" isRequired fieldId="agent-image">
            {!customImage ? (
              <>
                <FormSelect
                  id="agent-image"
                  value={imageRef}
                  onChange={(_e, v) => {
                    if (v === "__custom__") {
                      setCustomImageOverride(true);
                      setImageRef("");
                    } else {
                      setImageRef(v);
                    }
                  }}
                >
                  <FormSelectOption value="" label="Select an image..." />
                  {images.map((img) => (
                    <FormSelectOption
                      key={img.image}
                      value={img.image}
                      label={`${img.displayName} (${img.image})`}
                    />
                  ))}
                  <FormSelectOption
                    value="__custom__"
                    label="-- Custom image --"
                  />
                </FormSelect>
              </>
            ) : (
              <>
                <TextInput
                  id="agent-image-custom"
                  value={imageRef}
                  onChange={(_e, v) => setImageRef(v)}
                  placeholder="quay.io/org/image:tag"
                />
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setCustomImageOverride(false);
                    setImageRef(images[0]?.image ?? "");
                  }}
                  style={{ paddingLeft: 0, marginTop: 4 }}
                >
                  Back to catalog
                </Button>
              </>
            )}
          </FormGroup>

          {/* ---------- Prompt ---------- */}
          <FormGroup label="Prompt" fieldId="agent-prompt">
            <TextArea
              id="agent-prompt"
              value={prompt}
              onChange={(_e, v) => setPrompt(v)}
              rows={4}
              resizeOrientation="vertical"
            />
          </FormGroup>

          {/* ---------- Providers ---------- */}
          <FormGroup label="Providers" fieldId="agent-providers">
            {providers.length === 0 ? (
              <HelperText>
                <HelperTextItem>No providers available</HelperTextItem>
              </HelperText>
            ) : (
              providers.map((prov) => {
                const ref = prov.metadata.name!;
                const idx = selectedProviders.indexOf(ref);
                const isSelected = idx !== -1;
                return (
                  <div key={ref} style={{ marginBottom: 4 }}>
                    <Checkbox
                      id={`prov-${ref}`}
                      label={
                        <>
                          {ref}
                          {isSelected && idx === 0 && (
                            <Label
                              color="blue"
                              isCompact
                              style={{ marginLeft: 8 }}
                            >
                              1st
                            </Label>
                          )}
                        </>
                      }
                      isChecked={isSelected}
                      onChange={() => toggleProvider(ref)}
                    />
                  </div>
                );
              })
            )}
          </FormGroup>

          {/* ---------- Skill Cards ---------- */}
          <FormGroup label="Skill cards" fieldId="agent-skill-cards">
            {skillCards.length === 0 ? (
              <HelperText>
                <HelperTextItem>No skill cards available</HelperTextItem>
              </HelperText>
            ) : (
              skillCards.map((sc) => {
                const ref = sc.metadata.name!;
                return (
                  <div key={ref} style={{ marginBottom: 4 }}>
                    <Checkbox
                      id={`sc-${ref}`}
                      label={
                        <>
                          {sc.spec.displayName ?? ref}{" "}
                          <ReadyLabel conditions={sc.status?.conditions} />
                          {sc.status?.resolvedImage && (
                            <span
                              style={{
                                marginLeft: 8,
                                fontSize: "0.85em",
                                color: "var(--pf-t--global--color--200)",
                              }}
                            >
                              {sc.status.resolvedImage}
                            </span>
                          )}
                        </>
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
            label="Skill collections"
            fieldId="agent-skill-collections"
          >
            {skillCollections.length === 0 ? (
              <HelperText>
                <HelperTextItem>No skill collections available</HelperTextItem>
              </HelperText>
            ) : (
              skillCollections.map((col) => {
                const ref = col.metadata.name!;
                return (
                  <div key={ref} style={{ marginBottom: 4 }}>
                    <Checkbox
                      id={`col-${ref}`}
                      label={ref}
                      isChecked={selectedSkillCollections.includes(ref)}
                      onChange={() => toggleSkillCollection(ref)}
                    />
                  </div>
                );
              })
            )}
          </FormGroup>

          {totalSkills === 0 && (
            <Alert variant="danger" isInline title="No skills selected">
              An agent without skills has no tools to work with.
            </Alert>
          )}

          {/* ---------- Parameters ---------- */}
          <FormGroup label="Parameters" fieldId="agent-params">
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
                  aria-label="Param name"
                  placeholder="name"
                  value={p.name}
                  onChange={(_e, v) => updateParam(idx, { name: v })}
                  style={{ flex: "1 1 120px" }}
                />
                <FormSelect
                  aria-label="Param type"
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
                  aria-label="Description"
                  placeholder="description"
                  value={p.description}
                  onChange={(_e, v) => updateParam(idx, { description: v })}
                  style={{ flex: "2 1 160px" }}
                />
                <TextInput
                  aria-label="Default"
                  placeholder="default"
                  value={p.defaultValue}
                  onChange={(_e, v) => updateParam(idx, { defaultValue: v })}
                  style={{ flex: "1 1 100px" }}
                />
                <Checkbox
                  id={`param-req-${idx}`}
                  label="Required"
                  isChecked={p.required}
                  isDisabled={p.defaultValue !== ""}
                  onChange={(_e, checked) =>
                    updateParam(idx, { required: checked })
                  }
                  style={{ flex: "0 0 auto", marginTop: 6 }}
                />
                <Button
                  variant="plain"
                  aria-label="Remove parameter"
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
              + Add parameter
            </Button>
          </FormGroup>

          {submitError && (
            <Alert
              variant="danger"
              isInline
              title="Save failed"
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
          {isEdit ? "Save" : "Create"}
        </Button>
        <Button variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};
