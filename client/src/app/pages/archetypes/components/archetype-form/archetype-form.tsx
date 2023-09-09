import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import { Control, useForm, Path } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import {
  ActionGroup,
  Button,
  ButtonVariant,
  Form,
} from "@patternfly/react-core";

import type { Archetype, Tag } from "@app/api/models";
import {
  HookFormPFGroupController,
  HookFormPFTextArea,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { Autocomplete } from "@app/components/Autocomplete";
import { NotificationsContext } from "@app/components/NotificationsContext";
import {
  useFetchArchetypes,
  useFetchArchetypeById,
  useCreateArchetypeMutation,
  useUpdateArchetypeMutation,
} from "@app/queries/archetypes";
import { duplicateNameCheck, getAxiosErrorMessage } from "@app/utils/utils";
import { useFetchTagCategories } from "@app/queries/tags";

interface ArchetypeFormValues {
  name: string;
  description?: string;
  comments?: string;
  criteriaTags: string[]; // TODO: string[] only works if tags are uniquely named globally
  tags: string[]; // TODO: string[] only works if tags are uniquely named globally
  stakeholders?: object[];
  stakeholderGroups?: object[];
}

export interface ArchetypeFormProps {
  toEdit?: Archetype;
  onClose: () => void;
}

export const ArchetypeForm: React.FC<ArchetypeFormProps> = ({
  toEdit = undefined,
  onClose,
}) => {
  const isCreate = toEdit === undefined;
  const { t } = useTranslation();

  const {
    archetype,
    existingArchetypes,
    tags,
    createArchetype,
    updateArchetype,
  } = useArchetypeFormData({
    id: toEdit?.id,
    onActionSuccess: onClose,
  });

  const validationSchema = yup.object().shape({
    // for text input fields
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
          duplicateNameCheck(existingArchetypes, toEdit || null, value ?? "")
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
    criteriaTags: yup
      .array()
      .of(yup.string())
      .min(1)
      .required(t("validation.required")),

    tags: yup
      .array()
      .of(yup.string())
      .min(1)
      .required(t("validation.required")),

    // TODO: add stakeholders (optional)
    // TODO: add stakeholderGroups (optional)
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    control,
  } = useForm<ArchetypeFormValues>({
    defaultValues: {
      name: toEdit?.name || "",
      description: toEdit?.description || "",
      comments: toEdit?.comments || "",

      criteriaTags: toEdit?.criteriaTags?.map((tag) => tag.name).sort() ?? [],
      tags: toEdit?.archetypeTags?.map((tag) => tag.name).sort() ?? [],

      // TODO: add stakeholders
      // TODO: add stakeholderGroups
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const onValidSubmit = (values: ArchetypeFormValues) => {
    const payload: Archetype = {
      id: toEdit?.id || -1, // TODO: verify the -1 will be thrown out on create
      name: values.name.trim(),
      description: values.description?.trim() ?? "",
      comments: values.comments?.trim() ?? "",

      criteriaTags: values.criteriaTags
        .map((tagName) => tags.find((tag) => tag.name === tagName))
        .filter(Boolean) as Tag[],

      archetypeTags: values.tags
        .map((tagName) => tags.find((tag) => tag.name === tagName))
        .filter(Boolean) as Tag[],

      stakeholders: undefined, // TODO: add stakeholders
      stakeholderGroups: undefined, // TODO: add stakeholderGroups
    };

    if (isCreate) {
      createArchetype(payload);
    } else {
      updateArchetype(payload);
    }
  };

  return (
    <Form onSubmit={handleSubmit(onValidSubmit)} id="archetype-form">
      <HookFormPFTextInput
        control={control}
        name="name"
        label="Name" // TODO: l10n
        fieldId="name"
        isRequired
      />

      <HookFormPFTextInput
        control={control}
        name="description"
        label="Description" // TODO: l10n
        fieldId="description"
      />

      <TagsSelect
        tags={tags}
        control={control}
        name="criteriaTags"
        label="Criteria Tags" // TODO: l10n
        fieldId="criteriaTags"
        isRequired
        noResultsMessage={t("message.noResultsFoundTitle")}
        placeholderText={t("composed.selectMany", {
          what: t("terms.tags").toLowerCase(),
        })}
        searchInputAriaLabel="criteria-tags-select-toggle"
      />

      <TagsSelect
        tags={tags}
        control={control}
        name="tags"
        label="Archetype Tags" // TODO: l10n
        fieldId="archetypeTags"
        isRequired
        noResultsMessage={t("message.noResultsFoundTitle")}
        placeholderText={t("composed.selectMany", {
          what: t("terms.tags").toLowerCase(),
        })}
        searchInputAriaLabel="archetype-tags-select-toggle"
      />

      {/* TODO: add stakeholders */}
      {/* TODO: add stakeholderGroups */}

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
          isDisabled={!isValid || isSubmitting || isValidating || !isDirty}
        >
          {isCreate ? t("actions.create") : t("actions.save")}
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

// TODO: Currently only supports working with tag names (which only work if tags names are globally unique)
// TODO: Does not support select menu grouping by tag category
// TODO: Does not support select menu selection checkboxes
// TODO: Does not support rendering tag labels with tag category color
// TODO: Does not support rendering tag labels in tag category groups
const TagsSelect: React.FC<{
  tags: Tag[];
  control: Control<ArchetypeFormValues>;
  name: Path<ArchetypeFormValues>;
  label: string;
  fieldId: string;
  noResultsMessage: string;
  placeholderText: string;
  searchInputAriaLabel: string;
  isRequired: boolean;
}> = ({
  tags,
  control,
  name,
  label,
  fieldId,
  noResultsMessage,
  placeholderText,
  searchInputAriaLabel,
  isRequired = false,
}) => {
  return (
    <HookFormPFGroupController
      isRequired={isRequired}
      control={control}
      name={name}
      label={label}
      fieldId={fieldId}
      renderInput={({ field: { value, onChange } }) => (
        <Autocomplete
          id={fieldId}
          noResultsMessage={noResultsMessage}
          placeholderText={placeholderText}
          searchInputAriaLabel={searchInputAriaLabel}
          options={tags.map((tag) => tag.name).sort()}
          selections={Array.isArray(value) ? value : [value]}
          onChange={onChange}
        />
      )}
    />
  );
};

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

  const { archetypes: existingArchetypes } = useFetchArchetypes();
  const { archetype } = useFetchArchetypeById(id);

  const { tagCategories } = useFetchTagCategories();
  const tags = useMemo(
    () => tagCategories.flatMap((tc) => tc.tags).filter(Boolean) as Tag[],
    [tagCategories]
  );

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
  };
};
