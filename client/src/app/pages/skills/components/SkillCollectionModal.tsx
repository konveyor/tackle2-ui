import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Button,
  Form,
  FormFieldGroup,
  FormFieldGroupHeader,
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
import {
  ArrowDownIcon,
  ArrowUpIcon,
  InfoCircleIcon,
  MinusCircleIcon,
  PlusCircleIcon,
} from "@patternfly/react-icons";

import type {
  SkillCardType,
  SkillCollection,
  SkillCollectionSkillRef,
  SkillCollectionSpec,
} from "@app/api/agentic/contract";
import { RESOURCE_NAME_PATTERN } from "@app/api/agentic/contract";
import {
  useCreateSkillCollectionMutation,
  useFetchSkillCards,
  useUpdateSkillCollectionMutation,
} from "@app/queries/skills";
import { getAxiosErrorMessage } from "@app/utils/utils";

import { SkillCollectionMemberCardSelect } from "./SkillCollectionMemberCardSelect";

/** explicit = `spec.skills` member list; enumerate = `spec.image` (post-#157). */
type CollectionMode = "explicit" | "enumerate";

/** Which of the exactly-one reference fields a member row fills. */
type MemberKind = "skillCardRef" | "image" | "source";

interface MemberRow {
  id: number;
  name: string;
  kind: MemberKind;
  /** skillCardRef: card name · image: OCI ref · source: git URL. */
  value: string;
  /** source only. */
  ref: string;
  /** image + source. */
  subPath: string;
  /** image + source; a skillCardRef entry's type is the card's own. */
  type: SkillCardType;
}

let nextRowId = 1;

function emptyRow(): MemberRow {
  return {
    id: nextRowId++,
    name: "",
    kind: "skillCardRef",
    value: "",
    ref: "",
    subPath: "",
    type: "skill",
  };
}

function toRows(skills?: SkillCollectionSkillRef[]): MemberRow[] {
  if (!skills || skills.length === 0) return [emptyRow()];
  return skills.map((s) => {
    const kind: MemberKind = s.skillCardRef
      ? "skillCardRef"
      : s.source
        ? "source"
        : "image";
    return {
      id: nextRowId++,
      name: s.name,
      kind,
      value: s.skillCardRef ?? s.source ?? s.image ?? "",
      ref: s.ref ?? "",
      subPath: s.subPath ?? "",
      type: s.type ?? "skill",
    };
  });
}

const isBlank = (row: MemberRow) =>
  !row.name.trim() &&
  !row.value.trim() &&
  !row.ref.trim() &&
  !row.subPath.trim();

const isComplete = (row: MemberRow) => !!row.name.trim() && !!row.value.trim();

const fieldStyle: React.CSSProperties = { flex: "1 1 16rem", minWidth: 0 };

interface SkillCollectionModalProps {
  existing?: SkillCollection;
  onClose: () => void;
}

export const SkillCollectionModal: React.FC<SkillCollectionModalProps> = ({
  existing,
  onClose,
}) => {
  const { t } = useTranslation();
  const isEdit = !!existing;
  const { skillCards } = useFetchSkillCards();

  const initialMode: CollectionMode = existing?.spec.image
    ? "enumerate"
    : "explicit";

  const [name, setName] = useState(existing?.metadata.name ?? "");
  const [version, setVersion] = useState(existing?.spec.version ?? "");
  const [mode, setMode] = useState<CollectionMode>(initialMode);

  // enumerate mode
  const [image, setImage] = useState(existing?.spec.image ?? "");
  const [imageType, setImageType] = useState<SkillCardType>(
    existing?.spec.type ?? "skill"
  );

  // explicit mode
  const [members, setMembers] = useState<MemberRow[]>(
    toRows(existing?.spec.skills)
  );

  const [submitError, setSubmitError] = useState<string | null>(null);

  const nameValid = RESOURCE_NAME_PATTERN.test(name);

  const activeMembers = members.filter((m) => !isBlank(m));
  const completedMembers = activeMembers.filter(isComplete);
  const hasIncompleteMembers = activeMembers.length !== completedMembers.length;

  const memberNames = activeMembers.map((m) => m.name.trim()).filter(Boolean);
  const hasDuplicateNames = new Set(memberNames).size !== memberNames.length;

  const membersValid =
    completedMembers.length >= 1 && !hasIncompleteMembers && !hasDuplicateNames;

  const canSubmit =
    name.length > 0 &&
    nameValid &&
    (mode === "enumerate" ? image.trim().length > 0 : membersValid);

  const buildSpec = (): SkillCollectionSpec => {
    const spec: SkillCollectionSpec = {};
    if (version.trim()) spec.version = version.trim();

    if (mode === "enumerate") {
      spec.image = image.trim();
      spec.type = imageType;
      return spec;
    }

    spec.skills = completedMembers.map((m) => {
      const entry: SkillCollectionSkillRef = { name: m.name.trim() };
      const value = m.value.trim();
      const subPath = m.subPath.trim();
      switch (m.kind) {
        case "skillCardRef":
          entry.skillCardRef = value;
          break;
        case "image":
          entry.image = value;
          if (subPath) entry.subPath = subPath;
          entry.type = m.type;
          break;
        case "source":
          entry.source = value;
          if (m.ref.trim()) entry.ref = m.ref.trim();
          if (subPath) entry.subPath = subPath;
          entry.type = m.type;
          break;
      }
      return entry;
    });
    return spec;
  };

  const createMutation = useCreateSkillCollectionMutation(
    () => onClose(),
    (err) => setSubmitError(getAxiosErrorMessage(err))
  );

  const updateMutation = useUpdateSkillCollectionMutation(
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

  const updateMember = (id: number, patch: Partial<MemberRow>) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
    );
  };

  const addMember = () => {
    setMembers((prev) => [...prev, emptyRow()]);
  };

  const removeMember = (id: number) => {
    setMembers((prev) => {
      const next = prev.filter((m) => m.id !== id);
      return next.length === 0 ? [emptyRow()] : next;
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

  const modeLabel = (m: CollectionMode) =>
    t(
      m === "enumerate"
        ? "agentic.skills.modeEnumerateShort"
        : "agentic.skills.modeExplicitShort"
    );

  const typeHelp = (type: SkillCardType) =>
    t(
      type === "rule"
        ? "agentic.skills.typeRuleHelp"
        : "agentic.skills.typeSkillHelp"
    );

  const renderTypeSelect = (
    id: string,
    value: SkillCardType,
    onChange: (v: SkillCardType) => void,
    helper: string,
    ariaLabel?: string
  ) => (
    <FormGroup label={t("terms.type")} fieldId={id} style={fieldStyle}>
      <FormSelect
        id={id}
        aria-label={ariaLabel}
        value={value}
        onChange={(_e, v) => onChange(v as SkillCardType)}
      >
        <FormSelectOption value="skill" label={t("agentic.skills.typeSkill")} />
        <FormSelectOption value="rule" label={t("agentic.skills.typeRule")} />
      </FormSelect>
      <FormHelperText>
        <HelperText>
          <HelperTextItem>{helper}</HelperTextItem>
        </HelperText>
      </FormHelperText>
    </FormGroup>
  );

  const renderMemberFields = (row: MemberRow, index: number) => {
    const idx = index + 1;
    const base = `scol-member-${row.id}`;
    const valueAria = t("agentic.skills.memberValueAriaLabel", { index: idx });

    if (row.kind === "skillCardRef") {
      return (
        <FormGroup
          label={t("terms.skillCard")}
          isRequired
          fieldId={`${base}-card`}
          style={fieldStyle}
        >
          <SkillCollectionMemberCardSelect
            toggleId={`${base}-card`}
            ariaLabel={valueAria}
            value={row.value}
            skillCards={skillCards}
            onSelect={(card) => {
              const cardName = card.metadata.name ?? "";
              updateMember(row.id, {
                value: cardName,
                name: row.name.trim() ? row.name : cardName,
              });
            }}
          />
        </FormGroup>
      );
    }

    const isGit = row.kind === "source";
    return (
      <>
        <FormGroup
          label={isGit ? t("agentic.skills.repositoryUrl") : t("terms.image")}
          isRequired
          fieldId={`${base}-value`}
          style={{ flex: "2 1 20rem", minWidth: 0 }}
        >
          <TextInput
            id={`${base}-value`}
            aria-label={valueAria}
            isRequired
            value={row.value}
            onChange={(_e, v) => updateMember(row.id, { value: v })}
            placeholder={
              isGit
                ? t("agentic.skills.gitUrlPlaceholder")
                : t("agentic.skills.imageRefPlaceholder")
            }
          />
        </FormGroup>

        {isGit && (
          <FormGroup
            label={t("agentic.skills.ref")}
            fieldId={`${base}-ref`}
            style={fieldStyle}
          >
            <TextInput
              id={`${base}-ref`}
              value={row.ref}
              onChange={(_e, v) => updateMember(row.id, { ref: v })}
              placeholder={t("agentic.skills.refPlaceholder")}
            />
            {row.ref.trim().length === 0 && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem variant="warning">
                    {t("agentic.skills.refUnpinnedWarning")}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>
        )}

        <FormGroup
          label={t("agentic.skills.subPath")}
          fieldId={`${base}-subpath`}
          style={fieldStyle}
        >
          <TextInput
            id={`${base}-subpath`}
            value={row.subPath}
            onChange={(_e, v) => updateMember(row.id, { subPath: v })}
          />
          <FormHelperText>
            <HelperText>
              <HelperTextItem>
                {t(
                  isGit
                    ? "agentic.skills.subPathGitHelper"
                    : "agentic.skills.subPathHelper"
                )}
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        </FormGroup>

        {renderTypeSelect(
          `${base}-type`,
          row.type,
          (v) => updateMember(row.id, { type: v }),
          typeHelp(row.type),
          t("agentic.skills.memberTypeAriaLabel", { index: idx })
        )}
      </>
    );
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
        title={
          isEdit
            ? t("agentic.skills.editSkillCollection")
            : t("agentic.skills.createSkillCollection")
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

        {isEdit && mode !== initialMode && (
          <Alert
            variant="info"
            isInline
            title={t("agentic.skills.modeSwitchInfo", {
              from: modeLabel(initialMode),
              to: modeLabel(mode),
            })}
            style={{ marginBottom: "1rem" }}
          />
        )}

        <Form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) submit();
          }}
        >
          <FormGroup label={t("terms.name")} isRequired fieldId="scol-name">
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
                    {t("agentic.skills.nameValidationHelper")}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>

          <FormGroup label={t("terms.version")} fieldId="scol-version">
            <TextInput
              id="scol-version"
              value={version}
              onChange={(_e, v) => setVersion(v)}
              placeholder={t("agentic.skills.versionPlaceholder")}
            />
          </FormGroup>

          <FormGroup
            label={t("terms.mode")}
            isRequired
            fieldId="scol-mode"
            role="group"
          >
            <ToggleGroup id="scol-mode" aria-label={t("terms.mode")}>
              <ToggleGroupItem
                text={t("agentic.skills.modeExplicit")}
                buttonId="scol-mode-explicit"
                isSelected={mode === "explicit"}
                onChange={() => setMode("explicit")}
              />
              <ToggleGroupItem
                text={t("agentic.skills.modeEnumerate")}
                buttonId="scol-mode-enumerate"
                isSelected={mode === "enumerate"}
                onChange={() => setMode("enumerate")}
              />
            </ToggleGroup>
          </FormGroup>

          {mode === "enumerate" ? (
            <>
              <HelperText>
                <HelperTextItem icon={<InfoCircleIcon />}>
                  {t("agentic.skills.enumerateHelper")}
                </HelperTextItem>
              </HelperText>

              <FormGroup
                label={t("terms.image")}
                isRequired
                fieldId="scol-image"
              >
                <TextInput
                  id="scol-image"
                  isRequired
                  value={image}
                  onChange={(_e, v) => setImage(v)}
                  placeholder={t("agentic.skills.imagePlaceholder")}
                />
              </FormGroup>

              {renderTypeSelect(
                "scol-image-type",
                imageType,
                setImageType,
                `${t("agentic.skills.enumerateTypeHelper")} ${typeHelp(
                  imageType
                )}`
              )}
            </>
          ) : (
            <FormGroup
              label={t("agentic.skills.members")}
              isRequired
              fieldId="scol-members"
              role="group"
            >
              <div
                id="scol-members"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {members.map((row, index) => (
                  <FormFieldGroup
                    key={row.id}
                    header={
                      <FormFieldGroupHeader
                        titleText={{
                          text: t("agentic.skills.member", {
                            index: index + 1,
                          }),
                          id: `scol-member-${row.id}-title`,
                        }}
                        actions={
                          <>
                            <Button
                              variant="plain"
                              aria-label={t("agentic.skills.moveUp")}
                              isDisabled={index === 0}
                              onClick={() => moveMember(index, -1)}
                            >
                              <ArrowUpIcon />
                            </Button>
                            <Button
                              variant="plain"
                              aria-label={t("agentic.skills.moveDown")}
                              isDisabled={index === members.length - 1}
                              onClick={() => moveMember(index, 1)}
                            >
                              <ArrowDownIcon />
                            </Button>
                            <Button
                              variant="plain"
                              aria-label={t("agentic.skills.removeMember")}
                              onClick={() => removeMember(row.id)}
                            >
                              <MinusCircleIcon />
                            </Button>
                          </>
                        }
                      />
                    }
                  >
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "1rem",
                        alignItems: "flex-start",
                      }}
                    >
                      <FormGroup
                        label={t("terms.name")}
                        isRequired
                        fieldId={`scol-member-${row.id}-name`}
                        style={fieldStyle}
                      >
                        <TextInput
                          id={`scol-member-${row.id}-name`}
                          aria-label={t("agentic.skills.memberNameAriaLabel", {
                            index: index + 1,
                          })}
                          isRequired
                          value={row.name}
                          onChange={(_e, v) =>
                            updateMember(row.id, { name: v })
                          }
                        />
                      </FormGroup>

                      <FormGroup
                        label={t("terms.kind")}
                        isRequired
                        fieldId={`scol-member-${row.id}-kind`}
                        style={{ flex: "0 1 12rem", minWidth: 0 }}
                      >
                        <FormSelect
                          id={`scol-member-${row.id}-kind`}
                          aria-label={t("agentic.skills.memberKindAriaLabel", {
                            index: index + 1,
                          })}
                          value={row.kind}
                          onChange={(_e, v) =>
                            updateMember(row.id, {
                              kind: v as MemberKind,
                              value: "",
                              ref: "",
                              subPath: "",
                            })
                          }
                        >
                          <FormSelectOption
                            value="skillCardRef"
                            label={t("terms.skillCard")}
                          />
                          <FormSelectOption
                            value="image"
                            label={t("terms.image")}
                          />
                          <FormSelectOption
                            value="source"
                            label={t("agentic.skills.kindGit")}
                          />
                        </FormSelect>
                      </FormGroup>

                      {renderMemberFields(row, index)}
                    </div>
                  </FormFieldGroup>
                ))}
              </div>

              <Button
                variant="link"
                icon={<PlusCircleIcon />}
                onClick={addMember}
              >
                {t("agentic.skills.addMember")}
              </Button>

              {(hasDuplicateNames ||
                hasIncompleteMembers ||
                completedMembers.length === 0) && (
                <FormHelperText>
                  <HelperText>
                    {hasDuplicateNames && (
                      <HelperTextItem variant="error">
                        {t("agentic.skills.memberNamesUnique")}
                      </HelperTextItem>
                    )}
                    {hasIncompleteMembers && (
                      <HelperTextItem variant="error">
                        {t("agentic.skills.memberIncomplete")}
                      </HelperTextItem>
                    )}
                    {completedMembers.length === 0 && (
                      <HelperTextItem variant="error">
                        {t("agentic.skills.memberRequired")}
                      </HelperTextItem>
                    )}
                  </HelperText>
                </FormHelperText>
              )}
            </FormGroup>
          )}
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
