import React from "react";
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

import type { Archetype, TagRef } from "@app/api/models";
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

interface ArchetypeFormValues {
  name: string;
  description?: string;
  comments?: string;
  criteriaTags: TagRef[];
  tags: TagRef[];
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

  const { archetype, existingArchetypes, createArchetype, updateArchetype } =
    useArchetypeFormData({
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
    // TODO: add criteriaTags (at least 1 required)
    // TODO: add tags (at least 1 required)
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

      // TODO: add for criteriaTags, tags, stakeholders, stakeholderGroups
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const onValidSubmit = (formValues: ArchetypeFormValues) => {
    const payload: Archetype = {
      id: toEdit?.id || -1, // TODO: verify the -1 will be thrown out on create
      name: formValues.name.trim(),
      description: formValues.description?.trim() ?? "",
      comments: formValues.comments?.trim() ?? "",

      criteriaTags: [], // TODO: add criteriaTags
      archetypeTags: [], // TODO: add tags
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

      {/* TODO: add criteriaTags */}
      {/* TODO: add tags */}
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
  };
};
