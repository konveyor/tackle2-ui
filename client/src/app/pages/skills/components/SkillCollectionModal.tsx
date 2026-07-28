import React, { useState } from "react";
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
  TextInput,
} from "@patternfly/react-core";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  MinusCircleIcon,
  PlusCircleIcon,
} from "@patternfly/react-icons";

import type {
  SkillCollection,
  SkillCollectionSkillRef,
  SkillCollectionSpec,
} from "@app/api/agentic/contract";
import { RESOURCE_NAME_PATTERN } from "@app/api/agentic/contract";
import {
  useCreateSkillCollectionMutation,
  useUpdateSkillCollectionMutation,
} from "@app/queries/agent-runs";

type MemberKind = "skillCardRef" | "image";

interface MemberRow {
  id: number;
  name: string;
  kind: MemberKind;
  value: string;
}

let nextRowId = 1;

function toRows(skills?: SkillCollectionSkillRef[]): MemberRow[] {
  if (!skills || skills.length === 0) {
    return [{ id: nextRowId++, name: "", kind: "skillCardRef", value: "" }];
  }
  return skills.map((s) => ({
    id: nextRowId++,
    name: s.name,
    kind: s.skillCardRef ? "skillCardRef" : "image",
    value: s.skillCardRef ?? s.image ?? "",
  }));
}

interface SkillCollectionModalProps {
  existing?: SkillCollection;
  onClose: () => void;
}

export const SkillCollectionModal: React.FC<SkillCollectionModalProps> = ({
  existing,
  onClose,
}) => {
  const isEdit = !!existing;

  const [name, setName] = useState(existing?.metadata.name ?? "");
  const [members, setMembers] = useState<MemberRow[]>(
    toRows(existing?.spec.skills)
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const nameValid = RESOURCE_NAME_PATTERN.test(name);

  const completedMembers = members.filter(
    (m) => m.name.trim() && m.value.trim()
  );

  const memberNames = members.map((m) => m.name.trim()).filter(Boolean);
  const hasDuplicateNames = new Set(memberNames).size !== memberNames.length;

  const canSubmit =
    name.length > 0 &&
    nameValid &&
    completedMembers.length >= 1 &&
    !hasDuplicateNames;

  const buildSpec = (): SkillCollectionSpec => {
    const skills: SkillCollectionSkillRef[] = completedMembers.map((m) => {
      const ref: SkillCollectionSkillRef = { name: m.name.trim() };
      if (m.kind === "skillCardRef") {
        ref.skillCardRef = m.value.trim();
      } else {
        ref.image = m.value.trim();
      }
      return ref;
    });
    return { skills };
  };

  const createMutation = useCreateSkillCollectionMutation(
    () => onClose(),
    (err) => setSubmitError(err.message)
  );

  const updateMutation = useUpdateSkillCollectionMutation(
    () => onClose(),
    (err) => setSubmitError(err.message)
  );

  const isSubmitting = createMutation.isLoading || updateMutation.isLoading;

  const submit = () => {
    setSubmitError(null);
    const spec = buildSpec();
    if (isEdit) {
      updateMutation.mutate({ name, spec });
    } else {
      createMutation.mutate({ name, spec });
    }
  };

  const updateMember = (id: number, patch: Partial<MemberRow>) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
    );
  };

  const addMember = () => {
    setMembers((prev) => [
      ...prev,
      { id: nextRowId++, name: "", kind: "skillCardRef", value: "" },
    ]);
  };

  const removeMember = (id: number) => {
    setMembers((prev) => {
      const next = prev.filter((m) => m.id !== id);
      if (next.length === 0) {
        return [{ id: nextRowId++, name: "", kind: "skillCardRef", value: "" }];
      }
      return next;
    });
  };

  const moveMember = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= members.length) return;
    setMembers((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  return (
    <Modal
      variant={ModalVariant.large}
      isOpen
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <ModalHeader
        title={isEdit ? "Edit skill collection" : "Create skill collection"}
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
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) submit();
          }}
        >
          <FormGroup label="Name" isRequired fieldId="scol-name">
            <TextInput
              id="scol-name"
              isRequired
              isDisabled={isEdit}
              value={name}
              onChange={(_e, v) => setName(v)}
              validated={
                name.length === 0 ? "default" : nameValid ? "success" : "error"
              }
            />
            {name.length > 0 && !nameValid && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem variant="error">
                    Must match Kubernetes naming rules (lowercase alphanumeric,
                    hyphens, dots).
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>

          <FormGroup label="Members" isRequired fieldId="scol-members">
            {members.map((row, index) => (
              <div
                key={row.id}
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "flex-start",
                  marginBottom: "0.5rem",
                }}
              >
                <TextInput
                  aria-label={`Member ${index + 1} name`}
                  placeholder="Name"
                  value={row.name}
                  onChange={(_e, v) => updateMember(row.id, { name: v })}
                  style={{ flex: "1" }}
                />

                <FormSelect
                  aria-label={`Member ${index + 1} kind`}
                  value={row.kind}
                  onChange={(_e, v) =>
                    updateMember(row.id, {
                      kind: v as MemberKind,
                      value: "",
                    })
                  }
                  style={{ flex: "0 0 160px" }}
                >
                  <FormSelectOption value="skillCardRef" label="Skill card" />
                  <FormSelectOption value="image" label="Direct image" />
                </FormSelect>

                <TextInput
                  aria-label={`Member ${index + 1} value`}
                  placeholder={
                    row.kind === "skillCardRef"
                      ? "SkillCard name"
                      : "quay.io/org/image:tag"
                  }
                  value={row.value}
                  onChange={(_e, v) => updateMember(row.id, { value: v })}
                  style={{ flex: "1.5" }}
                />

                <Button
                  variant="plain"
                  aria-label="Move up"
                  isDisabled={index === 0}
                  onClick={() => moveMember(index, -1)}
                >
                  <ArrowUpIcon />
                </Button>
                <Button
                  variant="plain"
                  aria-label="Move down"
                  isDisabled={index === members.length - 1}
                  onClick={() => moveMember(index, 1)}
                >
                  <ArrowDownIcon />
                </Button>
                <Button
                  variant="plain"
                  aria-label="Remove member"
                  onClick={() => removeMember(row.id)}
                >
                  <MinusCircleIcon />
                </Button>
              </div>
            ))}

            <Button
              variant="link"
              icon={<PlusCircleIcon />}
              onClick={addMember}
            >
              Add member
            </Button>

            {hasDuplicateNames && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem variant="error">
                    Member names must be unique within a collection.
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}

            {completedMembers.length === 0 && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem variant="error">
                    At least one member with a name and reference is required.
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          isDisabled={!canSubmit || isSubmitting}
          isLoading={isSubmitting}
          onClick={submit}
        >
          {isEdit ? "Save" : "Create"}
        </Button>
        <Button variant="link" isDisabled={isSubmitting} onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};
