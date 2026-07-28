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

import type {
  SkillCard,
  SkillCardSpec,
  SkillCardType,
} from "@app/api/agentic/contract";
import { RESOURCE_NAME_PATTERN } from "@app/api/agentic/contract";
import {
  useCreateSkillCardMutation,
  useUpdateSkillCardMutation,
} from "@app/queries/agent-runs";

interface SkillCardModalProps {
  existing?: SkillCard;
  onClose: () => void;
}

export const SkillCardModal: React.FC<SkillCardModalProps> = ({
  existing,
  onClose,
}) => {
  const isEdit = !!existing;

  const [name, setName] = useState(existing?.metadata.name ?? "");
  const [displayName, setDisplayName] = useState(
    existing?.spec.displayName ?? ""
  );
  const [description, setDescription] = useState(
    existing?.spec.description ?? ""
  );
  const [type, setType] = useState<SkillCardType>(
    existing?.spec.type ?? "skill"
  );
  const [image, setImage] = useState(existing?.spec.image ?? "");
  const [version, setVersion] = useState(existing?.spec.version ?? "");
  const [tagsText, setTagsText] = useState(
    existing?.spec.tags?.join(", ") ?? ""
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isConvertingSource =
    isEdit &&
    !existing?.spec.image &&
    (!!existing?.spec.inline || !!existing?.spec.source);

  const nameValid = RESOURCE_NAME_PATTERN.test(name);
  const canSubmit = name.length > 0 && nameValid && image.trim().length > 0;

  const buildSpec = (): SkillCardSpec => {
    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    return {
      displayName: displayName.trim() || undefined,
      description: description.trim() || undefined,
      type,
      image: image.trim(),
      version: version.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    };
  };

  const createMutation = useCreateSkillCardMutation(
    () => onClose(),
    (err) => setSubmitError(err.message)
  );

  const updateMutation = useUpdateSkillCardMutation(
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

  return (
    <Modal
      variant={ModalVariant.medium}
      isOpen
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <ModalHeader title={isEdit ? "Edit skill card" : "Create skill card"} />
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

        {isConvertingSource && (
          <Alert
            variant="warning"
            isInline
            title="Source conversion"
            style={{ marginBottom: "1rem" }}
          >
            This skill card currently uses an{" "}
            {existing?.spec.inline ? "inline" : "git source"} definition. Saving
            will convert it to an image reference, replacing the original
            source.
          </Alert>
        )}

        <Form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) submit();
          }}
        >
          <FormGroup label="Name" isRequired fieldId="sc-name">
            <TextInput
              id="sc-name"
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

          <FormGroup label="Display name" fieldId="sc-display-name">
            <TextInput
              id="sc-display-name"
              value={displayName}
              onChange={(_e, v) => setDisplayName(v)}
            />
          </FormGroup>

          <FormGroup label="Description" fieldId="sc-description">
            <TextInput
              id="sc-description"
              value={description}
              onChange={(_e, v) => setDescription(v)}
            />
          </FormGroup>

          <FormGroup label="Type" isRequired fieldId="sc-type">
            <FormSelect
              id="sc-type"
              value={type}
              onChange={(_e, v) => setType(v as SkillCardType)}
            >
              <FormSelectOption value="skill" label="Skill" />
              <FormSelectOption value="rule" label="Rule" />
            </FormSelect>
          </FormGroup>

          <FormGroup label="Image" isRequired fieldId="sc-image">
            <TextInput
              id="sc-image"
              isRequired
              value={image}
              onChange={(_e, v) => setImage(v)}
              placeholder="quay.io/org/skill-image:latest"
            />
          </FormGroup>

          <FormGroup label="Version" fieldId="sc-version">
            <TextInput
              id="sc-version"
              value={version}
              onChange={(_e, v) => setVersion(v)}
              placeholder="1.0.0"
            />
          </FormGroup>

          <FormGroup label="Tags" fieldId="sc-tags">
            <TextInput
              id="sc-tags"
              value={tagsText}
              onChange={(_e, v) => setTagsText(v)}
              placeholder="java, migration, eap"
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem>Comma-separated list of tags.</HelperTextItem>
              </HelperText>
            </FormHelperText>
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
