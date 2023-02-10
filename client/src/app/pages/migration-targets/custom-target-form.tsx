import * as React from "react";
import {
  ActionGroup,
  Button,
  ButtonVariant,
  Form,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { AxiosResponse } from "axios";
import { useForm } from "react-hook-form";
import * as yup from "yup";

import { MigrationTarget, Rule } from "@app/api/models";
import { HookFormPFTextInput } from "@app/shared/components/hook-form-pf-fields";
import { yupResolver } from "@hookform/resolvers/yup";

export interface CustomTargetFormProps {
  target?: MigrationTarget;
  onSaved: (response: AxiosResponse<MigrationTarget>) => void;
  onCancel: () => void;
}

interface CustomTargetFormValues {
  id: number;
  name: string;
  description: string;
  image: string;
  // rules: Rule[];
  // repository: any;
}

export const CustomTargetForm: React.FC<CustomTargetFormProps> = ({
  target,
  onSaved,
  onCancel,
}) => {
  const { t } = useTranslation();

  const validationSchema: yup.SchemaOf<CustomTargetFormValues> = yup
    .object()
    .shape({
      id: yup.number().defined(),
      name: yup
        .string()
        .trim()
        .required(t("validation.required"))
        .min(3, t("validation.minLength", { length: 3 }))
        .max(120, t("validation.maxLength", { length: 120 })),
      // .test(
      //   "Duplicate name",
      //   "An identity with this name already exists. Please use a different name.",
      //   (value) =>
      //     duplicateNameCheck(identities, identity || null, value || "")
      // ),
      description: yup
        .string()
        .defined()
        .trim()
        .max(250, t("validation.maxLength", { length: 250 })),
      image: yup
        .string()
        .defined()
        .trim()
        .max(250, t("validation.maxLength", { length: 250 })),
      //TODO rules validation
      // rules: yup.array().defined(),
      //TODO repo validation
      // repository: yup.object().shape({}).defined(),
    });

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    getValues,
    setValue,
    control,
    watch,
  } = useForm<CustomTargetFormValues>({
    defaultValues: {
      name: target?.name || "",
      description: target?.description || "",
      id: target?.id || 0,
    },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  const onSubmit = (formValues: CustomTargetFormValues) => {
    const payload: MigrationTarget = {
      name: formValues.name.trim(),
      description: formValues.description.trim(),
      id: formValues.id,
      image: "",
      rules: [{ name: "", content: "" }],
      custom: true,
      order: 0,
    };
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
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
        isRequired
      />{" "}
      <ActionGroup>
        <Button
          type="submit"
          aria-label="submit"
          id="identity-form-submit"
          variant={ButtonVariant.primary}
          isDisabled={!isValid || isSubmitting || isValidating || !isDirty}
        >
          {!target ? t("actions.create") : t("actions.save")}
        </Button>
        <Button
          type="button"
          id="cancel"
          aria-label="cancel"
          variant={ButtonVariant.link}
          isDisabled={isSubmitting || isValidating}
          onClick={onCancel}
        >
          {t("actions.cancel")}
        </Button>
      </ActionGroup>
    </Form>
  );
};
