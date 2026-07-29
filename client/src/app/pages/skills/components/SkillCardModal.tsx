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
} from "@app/queries/skills";
import { getAxiosErrorMessage } from "@app/utils/utils";

interface SkillCardModalProps {
  existing?: SkillCard;
  onClose: () => void;
}

export const SkillCardModal: React.FC<SkillCardModalProps> = ({
  existing,
  onClose,
}) => {
  const { t } = useTranslation();
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
    (err) => setSubmitError(getAxiosErrorMessage(err))
  );

  const updateMutation = useUpdateSkillCardMutation(
    () => onClose(),
    (err) => setSubmitError(getAxiosErrorMessage(err))
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
      <ModalHeader
        title={
          isEdit
            ? t("agentic.skills.editSkillCard")
            : t("agentic.skills.createSkillCard")
        }
      />
      <ModalBody>
        {submitError && (
          <Alert
            variant="danger"
            isInline
            title={
              isEdit
                ? t("agentic.skills.updateFailed")
                : t("agentic.skills.createFailed")
            }
            style={{ marginBottom: "1rem" }}
          >
            {submitError}
          </Alert>
        )}

        {isConvertingSource && (
          <Alert
            variant="warning"
            isInline
            title={t("agentic.skills.sourceConversionTitle")}
            style={{ marginBottom: "1rem" }}
          >
            {t("agentic.skills.sourceConversionBody", {
              source: existing?.spec.inline
                ? t("agentic.skills.sourceInline")
                : t("agentic.skills.sourceGitDefinition"),
            })}
          </Alert>
        )}

        <Form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) submit();
          }}
        >
          <FormGroup label={t("terms.name")} isRequired fieldId="sc-name">
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
                    {t("agentic.skills.nameValidationHelper")}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>

          <FormGroup label={t("terms.displayName")} fieldId="sc-display-name">
            <TextInput
              id="sc-display-name"
              value={displayName}
              onChange={(_e, v) => setDisplayName(v)}
            />
          </FormGroup>

          <FormGroup label={t("terms.description")} fieldId="sc-description">
            <TextInput
              id="sc-description"
              value={description}
              onChange={(_e, v) => setDescription(v)}
            />
          </FormGroup>

          <FormGroup label={t("terms.type")} isRequired fieldId="sc-type">
            <FormSelect
              id="sc-type"
              value={type}
              onChange={(_e, v) => setType(v as SkillCardType)}
            >
              <FormSelectOption
                value="skill"
                label={t("agentic.skills.typeSkill")}
              />
              <FormSelectOption
                value="rule"
                label={t("agentic.skills.typeRule")}
              />
            </FormSelect>
          </FormGroup>

          <FormGroup label={t("terms.image")} isRequired fieldId="sc-image">
            <TextInput
              id="sc-image"
              isRequired
              value={image}
              onChange={(_e, v) => setImage(v)}
              placeholder={t("agentic.skills.imagePlaceholder")}
            />
          </FormGroup>

          <FormGroup label={t("terms.version")} fieldId="sc-version">
            <TextInput
              id="sc-version"
              value={version}
              onChange={(_e, v) => setVersion(v)}
              placeholder={t("agentic.skills.versionPlaceholder")}
            />
          </FormGroup>

          <FormGroup label={t("terms.tags")} fieldId="sc-tags">
            <TextInput
              id="sc-tags"
              value={tagsText}
              onChange={(_e, v) => setTagsText(v)}
              placeholder={t("agentic.skills.tagsPlaceholder")}
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem>
                  {t("agentic.skills.tagsHelper")}
                </HelperTextItem>
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
          {isEdit ? t("actions.save") : t("actions.create")}
        </Button>
        <Button variant="link" isDisabled={isSubmitting} onClick={onClose}>
          {t("actions.cancel")}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
