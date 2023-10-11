import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import {
  ActionGroup,
  Button,
  ButtonVariant,
  Form,
} from "@patternfly/react-core";

import type {
  Archetype,
  New,
  Stakeholder,
  StakeholderGroup,
  Tag,
  TagRef,
} from "@app/api/models";
import {
  HookFormPFTextArea,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { NotificationsContext } from "@app/components/NotificationsContext";
import {
  useFetchArchetypes,
  useFetchArchetypeById,
  useCreateArchetypeMutation,
  useUpdateArchetypeMutation,
} from "@app/queries/archetypes";
import {
  dedupeArrayOfObjects,
  duplicateNameCheck,
  getAxiosErrorMessage,
} from "@app/utils/utils";
import { useFetchTagCategories } from "@app/queries/tags";

import { useFetchStakeholderGroups } from "@app/queries/stakeholdergoups";
import { useFetchStakeholders } from "@app/queries/stakeholders";
import ItemsSelect from "@app/components/items-select/items-select";
import { matchItemsToRefs } from "@app/utils/model-utils";

export interface ArchetypeFormValues {
  name: string;
  description?: string;
  comments?: string;

  // TODO: a string[] only works here with `Autocomplete` if the entities have globally unique names
  criteria: string[];
  tags: string[];
  stakeholders?: string[];
  stakeholderGroups?: string[];
}

export interface ArchetypeFormProps {
  archetype?: Archetype | null;
  isDuplicating?: boolean;
  onClose: () => void;
}

export const ArchetypeForm: React.FC<ArchetypeFormProps> = ({
  archetype,
  isDuplicating = false,
  onClose,
}) => {
  const { t } = useTranslation();

  const {
    existingArchetypes,
    tags,
    tagsToRefs,
    stakeholders,
    stakeholdersToRefs,
    stakeholderGroups,
    stakeholderGroupsToRefs,
    createArchetype,
    updateArchetype,
  } = useArchetypeFormData({
    id: archetype?.id,
    onActionSuccess: onClose,
  });

  const manualTags: TagRef[] = useMemo(() => {
    const rawManualTags: TagRef[] =
      archetype?.tags?.filter((t) => !t?.source) ?? [];
    return dedupeArrayOfObjects<TagRef>(rawManualTags, "name");
  }, [archetype?.tags]);

  const assessmentTags: TagRef[] = useMemo(() => {
    const rawAssessmentTags: TagRef[] =
      archetype?.tags?.filter((t) => t?.source === "assessment") ?? [];
    return dedupeArrayOfObjects<TagRef>(rawAssessmentTags, "name");
  }, [archetype?.tags]);

  const validationSchema = yup.object().shape({
    name: yup
      .string()
      .trim()
      .required(t("validation.required"))
      .min(3, t("validation.minLength", { length: 3 }))
      .max(120, t("validation.maxLength", { length: 120 }))
      .test(
        "Duplicate name",
        "An archetype with this name already exists. Use a different name.",
        (value) =>
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

    // for complex data fields
    criteria: yup
      .array()
      .of(yup.string())
      .min(1)
      .required(t("validation.required")),

    tags: yup
      .array()
      .of(yup.string())
      .min(1)
      .required(t("validation.required")),

    stakeholders: yup.array().of(yup.string()),

    stakeholderGroups: yup.array().of(yup.string()),
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
    //for debugging
    getValues,
    getFieldState,
    formState,
  } = useForm<ArchetypeFormValues>({
    defaultValues: {
      name: getDefaultName(),
      description: archetype?.description || "",
      comments: archetype?.comments || "",

      criteria: archetype?.criteria?.map((tag) => tag.name).sort() ?? [],
      tags: manualTags.map((tag) => tag.name).sort() ?? [],

      stakeholders: archetype?.stakeholders?.map((sh) => sh.name).sort() ?? [],
      stakeholderGroups:
        archetype?.stakeholderGroups?.map((sg) => sg.name).sort() ?? [],
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const onValidSubmit = (values: ArchetypeFormValues) => {
    // Note: We need to manually retain the tags with source != "" in the payload
    const tags = [...(tagsToRefs(values.tags) ?? []), ...assessmentTags];
    const criteriaTags = tagsToRefs(values.criteria) ?? [];

    const payload: New<Archetype> = {
      name: values.name.trim(),
      description: values.description?.trim() ?? "",
      comments: values.comments?.trim() ?? "",
      criteria: values.criteria
        .map((tagName) => criteriaTags.find((tag) => tag.name === tagName))
        .filter(Boolean),

      tags: values.tags
        .map((tagName) => tags.find((tag) => tag.name === tagName))
        .filter(Boolean),

      stakeholders: stakeholdersToRefs(values.stakeholders),
      stakeholderGroups: stakeholderGroupsToRefs(values.stakeholderGroups),
    };

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

      <ItemsSelect<Tag, ArchetypeFormValues>
        items={tags}
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

      <ItemsSelect<Tag, ArchetypeFormValues>
        items={tags}
        control={control}
        name="tags"
        label="Archetype Tags"
        fieldId="tags"
        isRequired
        noResultsMessage={t("message.noResultsFoundTitle")}
        placeholderText={t("composed.selectMany", {
          what: t("terms.tags").toLowerCase(),
        })}
        searchInputAriaLabel="archetype-tags-select-toggle"
      />

      <ItemsSelect<Stakeholder, ArchetypeFormValues>
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

      <ItemsSelect<StakeholderGroup, ArchetypeFormValues>
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

export default ArchetypeForm;

const useArchetypeFormData = ({
  id,
  onActionSuccess = () => {},
  onActionFail = () => {},
}: {
  id?: number;
  onActionSuccess?: () => void;
  onActionFail?: () => void;
}) => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  // Fetch data
  const { archetypes: existingArchetypes } = useFetchArchetypes();
  const { archetype } = useFetchArchetypeById(id);

  const { tagCategories } = useFetchTagCategories();
  const tags = useMemo(
    () => tagCategories.flatMap((tc) => tc.tags).filter(Boolean) as Tag[],
    [tagCategories]
  );

  const { stakeholderGroups } = useFetchStakeholderGroups();
  const { stakeholders } = useFetchStakeholders();

  // Helpers
  const tagsToRefs = (names: string[] | undefined | null) =>
    matchItemsToRefs(tags, (i) => i.name, names);

  const stakeholdersToRefs = (names: string[] | undefined | null) =>
    matchItemsToRefs(stakeholders, (i) => i.name, names);

  const stakeholderGroupsToRefs = (names: string[] | undefined | null) =>
    matchItemsToRefs(stakeholderGroups, (i) => i.name, names);

  // Mutation notification handlers
  const onCreateSuccess = (archetype: Archetype) => {
    pushNotification({
      title: t("toastr.success.createWhat", {
        type: t("terms.archetype"),
        what: archetype.name,
      }),
      variant: "success",
    });
    onActionSuccess();
  };

  const onUpdateSuccess = (_id: number) => {
    pushNotification({
      title: t("toastr.success.save", {
        type: t("terms.archetype"),
      }),
      variant: "success",
    });
    onActionSuccess();
  };

  const onCreateUpdateError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
    onActionFail();
  };

  const { mutate: createArchetype } = useCreateArchetypeMutation(
    onCreateSuccess,
    onCreateUpdateError
  );

  const { mutate: updateArchetype } = useUpdateArchetypeMutation(
    onUpdateSuccess,
    onCreateUpdateError
  );

  return {
    archetype,
    existingArchetypes,
    createArchetype,
    updateArchetype,
    tagCategories,
    tags,
    tagsToRefs,
    stakeholders,
    stakeholdersToRefs,
    stakeholderGroups,
    stakeholderGroupsToRefs,
  };
};
