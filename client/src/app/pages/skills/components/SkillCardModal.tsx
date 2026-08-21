import React, { useRef, useState } from "react";
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
  ToggleGroup,
  ToggleGroupItem,
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
import type { SkillSourceKind } from "@app/utils/skills";
import { buildSkillMarkdown, skillSourceKind } from "@app/utils/skills";
import { getAxiosErrorMessage } from "@app/utils/utils";

import {
  SkillCardMarkdownEditor,
  useSkillMarkdownIssues,
} from "./SkillCardMarkdownEditor";

interface SkillCardModalProps {
  existing?: SkillCard;
  onClose: () => void;
}

/** Toggle order: inline first because it is the one path that needs nothing outside the console. */
const SOURCE_KINDS: SkillSourceKind[] = ["inline", "image", "source"];

/** Toggle button labels (capitalised) — the table labels reuse the lowercase `sourceX` keys. */
const SOURCE_KIND_LABEL_KEY: Record<SkillSourceKind, string> = {
  inline: "agentic.skills.sourceKindInline",
  image: "agentic.skills.sourceKindImage",
  source: "agentic.skills.sourceKindGit",
};

/** Lowercase noun for sentences ("replace the current inline source with the git source"). */
const SOURCE_KIND_NOUN_KEY: Record<SkillSourceKind, string> = {
  inline: "agentic.skills.sourceInline",
  image: "agentic.skills.sourceImage",
  source: "agentic.skills.sourceGit",
};

const helper = (
  text: React.ReactNode,
  variant: "default" | "warning" | "error" = "default"
) => (
  <FormHelperText>
    <HelperText>
      <HelperTextItem variant={variant}>{text}</HelperTextItem>
    </HelperText>
  </FormHelperText>
);

export const SkillCardModal: React.FC<SkillCardModalProps> = ({
  existing,
  onClose,
}) => {
  const { t } = useTranslation();
  const isEdit = !!existing;
  const existingKind = existing ? skillSourceKind(existing.spec) : undefined;

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
  const [sourceKind, setSourceKind] = useState<SkillSourceKind>(
    existingKind ?? "inline"
  );
  // Source fields are kept per kind so switching back and forth never leaks
  // one kind's value (e.g. an image sub-path) into another's form.
  const [inline, setInline] = useState(existing?.spec.inline ?? "");
  const [image, setImage] = useState(existing?.spec.image ?? "");
  const [imageSubPath, setImageSubPath] = useState(
    existingKind === "image" ? (existing?.spec.subPath ?? "") : ""
  );
  const [source, setSource] = useState(existing?.spec.source ?? "");
  const [ref, setRef] = useState(existing?.spec.ref ?? "");
  const [sourceSubPath, setSourceSubPath] = useState(
    existingKind === "source" ? (existing?.spec.subPath ?? "") : ""
  );
  const [version, setVersion] = useState(existing?.spec.version ?? "");
  const [tagsText, setTagsText] = useState(
    existing?.spec.tags?.join(", ") ?? ""
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const templateAutoInsertedRef = useRef(false);

  const nameValid = RESOURCE_NAME_PATTERN.test(name);
  const issues = useSkillMarkdownIssues(inline, name);

  const sourceValid =
    sourceKind === "inline"
      ? inline.trim().length > 0 && issues.errors.length === 0
      : sourceKind === "image"
        ? image.trim().length > 0
        : source.trim().length > 0;
  const canSubmit = name.length > 0 && nameValid && sourceValid;

  const templateMarkdown = () =>
    buildSkillMarkdown({
      name: name.trim() || "my-skill",
      description:
        description.trim() || t("agentic.skills.templateDescription"),
      title: displayName.trim() || name.trim() || "my-skill",
    });

  const selectSourceKind = (kind: SkillSourceKind) => {
    setSourceKind(kind);
    // First switch to inline on create with nothing typed yet: seed the
    // editor once, but only when there is a card name to seed it with.
    if (
      kind === "inline" &&
      !isEdit &&
      inline.trim() === "" &&
      nameValid &&
      !templateAutoInsertedRef.current
    ) {
      templateAutoInsertedRef.current = true;
      setInline(templateMarkdown());
    }
  };

  const buildSpec = (): SkillCardSpec => {
    // spec.tags is a k8s listType=set: the apiserver rejects duplicates.
    const tags = Array.from(
      new Set(
        tagsText
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      )
    );
    const common: SkillCardSpec = {
      displayName: displayName.trim() || undefined,
      description: description.trim() || undefined,
      type,
      version: version.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    };
    // Exactly one of image | source | inline may be set on the CR, so only
    // the selected kind's fields are emitted; the others are left out.
    switch (sourceKind) {
      case "inline":
        return { ...common, inline };
      case "image":
        return {
          ...common,
          image: image.trim(),
          subPath: imageSubPath.trim() || undefined,
        };
      case "source":
        return {
          ...common,
          source: source.trim(),
          ref: ref.trim() || undefined,
          subPath: sourceSubPath.trim() || undefined,
        };
    }
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

  const isSwitchingKind = !!existingKind && sourceKind !== existingKind;

  return (
    <Modal
      variant={ModalVariant.large}
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
            {name.length > 0 &&
              !nameValid &&
              helper(t("agentic.skills.nameValidationHelper"), "error")}
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
            {helper(t("agentic.skills.descriptionHelper"))}
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
            {helper(
              t(
                type === "rule"
                  ? "agentic.skills.typeRuleHelp"
                  : "agentic.skills.typeSkillHelp"
              )
            )}
          </FormGroup>

          <FormGroup
            label={t("terms.source")}
            isRequired
            fieldId="sc-source"
            role="group"
          >
            <ToggleGroup id="sc-source" aria-label={t("terms.source")}>
              {SOURCE_KINDS.map((kind) => (
                <ToggleGroupItem
                  key={kind}
                  buttonId={`sc-source-${kind}`}
                  text={t(SOURCE_KIND_LABEL_KEY[kind])}
                  isSelected={sourceKind === kind}
                  isDisabled={isSubmitting}
                  onChange={(_e, selected) => {
                    if (selected) selectSourceKind(kind);
                  }}
                />
              ))}
            </ToggleGroup>
          </FormGroup>

          {isSwitchingKind && (
            <Alert
              variant="info"
              isInline
              isPlain
              title={t("agentic.skills.sourceSwitchInfo", {
                from: t(SOURCE_KIND_NOUN_KEY[existingKind]),
                to: t(SOURCE_KIND_NOUN_KEY[sourceKind]),
              })}
            />
          )}

          {sourceKind === "inline" && (
            <FormGroup
              label={t("agentic.skills.inlineContent")}
              isRequired
              fieldId="sc-inline"
            >
              <SkillCardMarkdownEditor
                id="sc-inline"
                value={inline}
                onChange={setInline}
                issues={issues}
                onInsertTemplate={() => setInline(templateMarkdown())}
                isDisabled={isSubmitting}
              />
            </FormGroup>
          )}

          {sourceKind === "image" && (
            <>
              <FormGroup label={t("terms.image")} isRequired fieldId="sc-image">
                <TextInput
                  id="sc-image"
                  isRequired
                  value={image}
                  onChange={(_e, v) => setImage(v)}
                  placeholder={t("agentic.skills.imagePlaceholder")}
                />
              </FormGroup>
              <FormGroup
                label={t("agentic.skills.subPath")}
                fieldId="sc-image-subpath"
              >
                <TextInput
                  id="sc-image-subpath"
                  value={imageSubPath}
                  onChange={(_e, v) => setImageSubPath(v)}
                  placeholder={t("agentic.skills.subPathPlaceholder")}
                />
                {helper(t("agentic.skills.subPathHelper"))}
              </FormGroup>
            </>
          )}

          {sourceKind === "source" && (
            <>
              <FormGroup
                label={t("agentic.skills.repositoryUrl")}
                isRequired
                fieldId="sc-git-url"
              >
                <TextInput
                  id="sc-git-url"
                  isRequired
                  value={source}
                  onChange={(_e, v) => setSource(v)}
                  placeholder={t("agentic.skills.gitUrlPlaceholder")}
                />
              </FormGroup>
              <FormGroup label={t("agentic.skills.ref")} fieldId="sc-git-ref">
                <TextInput
                  id="sc-git-ref"
                  value={ref}
                  onChange={(_e, v) => setRef(v)}
                  placeholder={t("agentic.skills.refPlaceholder")}
                  validated={ref.trim() === "" ? "warning" : "default"}
                />
                {ref.trim() === ""
                  ? helper(t("agentic.skills.refUnpinnedWarning"), "warning")
                  : helper(t("agentic.skills.refHelper"))}
              </FormGroup>
              <FormGroup
                label={t("agentic.skills.subPath")}
                fieldId="sc-git-subpath"
              >
                <TextInput
                  id="sc-git-subpath"
                  value={sourceSubPath}
                  onChange={(_e, v) => setSourceSubPath(v)}
                  placeholder={t("agentic.skills.subPathGitPlaceholder")}
                />
                {helper(t("agentic.skills.subPathGitHelper"))}
              </FormGroup>
            </>
          )}

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
            {helper(t("agentic.skills.tagsHelper"))}
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
