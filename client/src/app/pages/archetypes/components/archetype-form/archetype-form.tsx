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
  Ref,
  Stakeholder,
  StakeholderGroup,
  Tag,
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
import { duplicateNameCheck, getAxiosErrorMessage } from "@app/utils/utils";
import { useFetchTagCategories } from "@app/queries/tags";

import { useFetchStakeholderGroups } from "@app/queries/stakeholdergoups";
import { useFetchStakeholders } from "@app/queries/stakeholders";
import ItemsSelect from "@app/components/items-select/items-select";

export interface ArchetypeFormValues {
  name: string;
  description?: string;
  comments?: string;

  // TODO: a string[] only works here with `Autocomplete` if the entities have globally unique names
  criteriaTags: string[];
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
    stakeholders,
    stakeholderGroups,
    createArchetype,
    updateArchetype,
  } = useArchetypeFormData({
    id: archetype?.id,
    onActionSuccess: onClose,
  });

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

      criteriaTags:
        archetype?.criteriaTags?.map((tag) => tag.name).sort() ?? [],
      tags: archetype?.tags?.map((tag) => tag.name).sort() ?? [],

      stakeholders: archetype?.stakeholders?.map((sh) => sh.name).sort() ?? [],
      stakeholderGroups:
        archetype?.stakeholderGroups?.map((sg) => sg.name).sort() ?? [],
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const onValidSubmit = (values: ArchetypeFormValues) => {
    const payload: New<Archetype> = {
      name: values.name.trim(),
      description: values.description?.trim() ?? "",
      comments: values.comments?.trim() ?? "",

      criteriaTags: values.criteriaTags
        .map((tagName) => tags.find((tag) => tag.name === tagName))
        .filter(Boolean) as Tag[],

      tags: values.tags
        .map((tagName) => tags.find((tag) => tag.name === tagName))
        .filter(Boolean) as Tag[],

      stakeholders:
        values.stakeholders === undefined
          ? undefined
          : (values.stakeholders
              .map((name) => stakeholders.find((s) => s.name === name))
              .map<Ref | undefined>((sh) =>
                !sh ? undefined : { id: sh.id, name: sh.name }
              )
              .filter(Boolean) as Ref[]),

      stakeholderGroups:
        values.stakeholderGroups === undefined
          ? undefined
          : (values.stakeholderGroups
              .map((name) => stakeholderGroups.find((s) => s.name === name))
              .map<Ref | undefined>((sg) =>
                !sg ? undefined : { id: sg.id, name: sg.name }
              )
              .filter(Boolean) as Ref[]),
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
        name="criteriaTags"
        label="Criteria Tags"
        fieldId="criteriaTags"
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
        fieldId="archetypeTags"
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

  const { archetypes: existingArchetypes } = useFetchArchetypes();
  const { archetype } = useFetchArchetypeById(id);

  const { tagCategories } = useFetchTagCategories();
  const tags = useMemo(
    () => tagCategories.flatMap((tc) => tc.tags).filter(Boolean) as Tag[],
    [tagCategories]
  );

  const { stakeholderGroups } = useFetchStakeholderGroups();
  const { stakeholders } = useFetchStakeholders();

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
    stakeholders,
    stakeholderGroups,
  };
};
