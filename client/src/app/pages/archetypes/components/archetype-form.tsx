import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import {
  ActionGroup,
  Button,
  ButtonVariant,
  Form,
} from "@patternfly/react-core";

import type { Archetype, New, Ref, TagRef } from "@app/api/models";
import {
  HookFormPFTextArea,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { useFetchArchetypes } from "@app/queries/archetypes";
import { type TagItemType, useFetchTagsWithTagItems } from "@app/queries/tags";
import { useFetchStakeholderGroups } from "@app/queries/stakeholdergroups";
import { useFetchStakeholders } from "@app/queries/stakeholders";
import { HookFormAutocomplete } from "@app/components/HookFormPFFields";
import { duplicateNameCheck, universalComparator } from "@app/utils/utils";
import { matchItemsToRefs } from "@app/utils/model-utils";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { AppPlaceholder } from "@app/components/AppPlaceholder";

import { useArchetypeMutations } from "../hooks/useArchetypeMutations";

export interface ArchetypeFormValues {
  name: string;
  description?: string;
  comments?: string;

  criteria: TagItemType[];
  tags: TagItemType[];
  stakeholders?: Ref[];
  stakeholderGroups?: Ref[];
}

export interface ArchetypeFormProps {
  archetype?: Archetype | null;
  isDuplicating?: boolean;
  onClose: () => void;
}

/**
 * TL;DR: Wait for all data to be ready before rendering the form so existing data is rendered!
 *
 * Wraps `ArchetypeFormReady` and render it when the form's data is ready to render.
 * Since the form's `defaultValues` are built on the first render, if the fetch data
 * is not ready at that moment, the initial values will be wrong.
 */
export const ArchetypeForm: React.FC<ArchetypeFormProps> = (props) => {
  const { isDataReady } = useArchetypeFormData();
  return (
    <ConditionalRender when={!isDataReady} then={<AppPlaceholder />}>
      <ArchetypeFormReady {...props} />
    </ConditionalRender>
  );
};

export default ArchetypeForm;

const ArchetypeFormReady: React.FC<ArchetypeFormProps> = ({
  archetype,
  isDuplicating = false,
  onClose,
}) => {
  const { t } = useTranslation();

  const {
    existingArchetypes,
    tagItems,
    idsToTagRefs,
    stakeholders,
    idsToStakeholderRefs,
    stakeholderGroups,
    idsToStakeholderGroupRefs,
    createArchetype,
    updateArchetype,
  } = useArchetypeFormData({
    onActionSuccess: onClose,
  });

  const manualTagRefs: TagRef[] = useMemo(() => {
    return archetype?.tags?.filter((t) => !t?.source) ?? [];
  }, [archetype?.tags]);

  const assessmentTagRefs: TagRef[] = useMemo(() => {
    return archetype?.tags?.filter((t) => t?.source === "assessment") ?? [];
  }, [archetype?.tags]);

  const validationSchema = yup.object().shape({
    name: yup
      .string()
      .trim()
      .required(t("validation.required"))
      .min(3, t("validation.minLength", { length: 3 }))
      .max(120, t("validation.maxLength", { length: 120 }))
      .test("Duplicate name", t("validation.duplicateArchetypeName"), (value) =>
        duplicateNameCheck(
          existingArchetypes,
          (!isDuplicating && archetype) || null,
          value ?? ""
        )
      ),

    description: yup
      .string()
      .trim()
      .max(250, t("validation.maxLength", { length: 250 })),

    comments: yup
      .string()
      .trim()
      .max(250, t("validation.maxLength", { length: 250 })),

    // for complex data fields (model a `Ref`)
    criteria: yup
      .array()
      .of(yup.object({ id: yup.number(), name: yup.string() }))
      .min(1, ({ min }) =>
        t("validation.minCount", {
          count: min,
          type: t("terms.tag").toLocaleLowerCase(),
          types: t("terms.tags").toLocaleLowerCase(),
        })
      )
      .required(t("validation.required")),

    tags: yup.array().of(yup.object({ id: yup.number(), name: yup.string() })),
    stakeholders: yup
      .array()
      .of(yup.object({ id: yup.number(), name: yup.string() })),

    stakeholderGroups: yup
      .array()
      .of(yup.object({ id: yup.number(), name: yup.string() })),
  });

  const getDefaultName = () => {
    if (!isDuplicating || !archetype) return archetype?.name || "";
    let name = `${archetype.name} (duplicate)`;
    for (let i = 2; existingArchetypes.find((a) => a.name === name); i++) {
      name = `${archetype.name} (duplicate ${i})`;
    }
    return name;
  };

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    control,
    // for debugging
    // getValues,
    // getFieldState,
    // formState,
  } = useForm<ArchetypeFormValues>({
    defaultValues: {
      name: getDefaultName(),
      description: archetype?.description || "",
      comments: archetype?.comments || "",

      criteria: (archetype?.criteria ?? [])
        .map(({ id }) => tagItems.find((tag) => tag.id === id))
        .filter(Boolean),

      tags: manualTagRefs
        .map(({ id }) => tagItems.find((tag) => tag.id === id))
        .filter(Boolean),

      stakeholders:
        archetype?.stakeholders?.sort((a, b) =>
          universalComparator(a.name, b.name)
        ) ?? [],
      stakeholderGroups:
        archetype?.stakeholderGroups?.sort((a, b) =>
          universalComparator(a.name, b.name)
        ) ?? [],
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const onValidSubmit = (values: ArchetypeFormValues) => {
    const payload: New<Archetype> = {
      name: values.name.trim(),
      description: values.description?.trim() ?? "",
      comments: values.comments?.trim() ?? "",

      criteria: idsToTagRefs(values.criteria.map((t) => t.id)) ?? [],

      // Note: We need to manually retain the assessment tags
      tags: [
        ...(idsToTagRefs(values.tags.map((t) => t.id)) ?? []),
        ...assessmentTagRefs,
      ],

      stakeholders: idsToStakeholderRefs(values.stakeholders?.map((s) => s.id)),
      stakeholderGroups: idsToStakeholderGroupRefs(
        values.stakeholderGroups?.map((s) => s.id)
      ),
    };

    // Note: We need to manually retain the target profiles
    if (archetype?.profiles) {
      payload.profiles = archetype.profiles.map(({ name, generators }) => ({
        id: 0,
        name,
        generators,
      }));
    }

    if (archetype && !isDuplicating) {
      updateArchetype({ id: archetype.id, ...payload });
    } else {
      createArchetype(payload);
    }
  };

  return (
    <Form onSubmit={handleSubmit(onValidSubmit)} id="archetype-form">
      <HookFormPFTextInput
        control={control}
        name="name"
        label="Name"
        fieldId="name"
        isRequired
      />

      <HookFormPFTextInput
        control={control}
        name="description"
        label="Description"
        fieldId="description"
      />

      <HookFormAutocomplete<ArchetypeFormValues>
        items={tagItems}
        control={control}
        name="criteria"
        label="Criteria Tags"
        fieldId="criteria"
        isRequired
        noResultsMessage={t("message.noResultsFoundTitle")}
        placeholderText={t("composed.selectMany", {
          what: t("terms.tags").toLowerCase(),
        })}
        searchInputAriaLabel="criteria-tags-select-toggle"
      />

      <HookFormAutocomplete<ArchetypeFormValues>
        items={tagItems}
        control={control}
        name="tags"
        label="Archetype Tags"
        fieldId="tags"
        noResultsMessage={t("message.noResultsFoundTitle")}
        placeholderText={t("composed.selectMany", {
          what: t("terms.tags").toLowerCase(),
        })}
        searchInputAriaLabel="archetype-tags-select-toggle"
      />

      <HookFormAutocomplete<ArchetypeFormValues>
        items={stakeholders}
        control={control}
        name="stakeholders"
        label="Stakeholder(s)"
        fieldId="stakeholders"
        noResultsMessage={t("message.noResultsFoundTitle")}
        placeholderText={t("composed.selectMany", {
          what: t("terms.stakeholder(s)").toLowerCase(),
        })}
        searchInputAriaLabel="stakeholder-select-toggle"
      />

      <HookFormAutocomplete<ArchetypeFormValues>
        items={stakeholderGroups}
        control={control}
        name="stakeholderGroups"
        label="Stakeholder Group(s)"
        fieldId="stakeholderGroups"
        noResultsMessage={t("message.noResultsFoundTitle")}
        placeholderText={t("composed.selectMany", {
          what: t("terms.stakeholderGroup(s)").toLowerCase(),
        })}
        searchInputAriaLabel="stakeholder-groups-select-toggle"
      />

      <HookFormPFTextArea
        control={control}
        name="comments"
        label={t("terms.comments")}
        fieldId="comments"
        resizeOrientation="vertical"
      />

      <ActionGroup>
        <Button
          type="submit"
          id="submit"
          aria-label="submit"
          variant={ButtonVariant.primary}
          isDisabled={
            !isValid ||
            isSubmitting ||
            isValidating ||
            (!isDirty && !isDuplicating)
          }
        >
          {!archetype || isDuplicating
            ? t("actions.create")
            : t("actions.save")}
        </Button>
        <Button
          type="button"
          id="cancel"
          aria-label="cancel"
          variant={ButtonVariant.link}
          isDisabled={isSubmitting || isValidating}
          onClick={onClose}
        >
          {t("actions.cancel")}
        </Button>
      </ActionGroup>
    </Form>
  );
};

const useArchetypeFormData = ({
  onActionSuccess = () => {},
  onActionFail = () => {},
}: {
  onActionSuccess?: () => void;
  onActionFail?: () => void;
} = {}) => {
  // Fetch data
  const { archetypes: existingArchetypes, isSuccess: isArchetypesSuccess } =
    useFetchArchetypes();

  const {
    tags,
    tagItems,
    isSuccess: isTagCategoriesSuccess,
  } = useFetchTagsWithTagItems();

  const { stakeholderGroups, isSuccess: isStakeholderGroupsSuccess } =
    useFetchStakeholderGroups();

  const { stakeholders, isSuccess: isStakeholdersSuccess } =
    useFetchStakeholders();

  // Helpers
  const idsToTagRefs = (ids: number[] | undefined | null) =>
    matchItemsToRefs(tags, (i) => i.id, ids);

  const idsToStakeholderRefs = (ids: number[] | undefined | null) =>
    matchItemsToRefs(stakeholders, (i) => i.id, ids);

  const idsToStakeholderGroupRefs = (ids: number[] | undefined | null) =>
    matchItemsToRefs(stakeholderGroups, (i) => i.id, ids);

  // Get mutations from custom hook
  const { createArchetype, updateArchetype } = useArchetypeMutations({
    onActionSuccess,
    onActionFail,
  });

  return {
    isDataReady:
      isArchetypesSuccess &&
      isTagCategoriesSuccess &&
      isStakeholdersSuccess &&
      isStakeholderGroupsSuccess,
    existingArchetypes,
    createArchetype,
    updateArchetype,
    tags,
    tagItems,
    idsToTagRefs,
    stakeholders,
    idsToStakeholderRefs,
    stakeholderGroups,
    idsToStakeholderGroupRefs,
  };
};
