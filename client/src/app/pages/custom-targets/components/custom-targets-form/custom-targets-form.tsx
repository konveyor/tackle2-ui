import React, { useMemo } from "react";
import {
  ActionGroup,
  Alert,
  Button,
  ButtonVariant,
  Form,
  Switch,
} from "@patternfly/react-core";
import { OptionWithValue, SimpleSelect } from "@app/shared/components";
import {
  duplicateNameCheck,
  getAxiosErrorMessage,
  getValidatedFromErrorTouched,
} from "@app/utils/utils";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { CustomTarget, Rule } from "@app/api/models";
// import { useUpdateCustomTargetMutation } from "@app/queries/customTargets";
import {
  Controller,
  FieldValues,
  SubmitHandler,
  useForm,
} from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useFetchIdentities } from "@app/queries/identities";
import { AxiosError } from "axios";
import {
  HookFormPFGroupController,
  HookFormPFTextArea,
  HookFormPFTextInput,
} from "@app/shared/components/hook-form-pf-fields";
import * as yup from "yup";
import { useTranslation } from "react-i18next";

export interface CustomTargetFormValues {
  name: string;
  description: string;
  image: string;
  rules: Rule[]; //TODO rules type
  repository: any; //TODO repository type
}

export interface CustomTargetFormProps {}

export const CustomTargetForm: React.FC<CustomTargetFormProps> = ({}) => {
  const { t } = useTranslation();
  let customTarget: CustomTarget;
  //   const { customTargets } = useFetchCustomTargets());
  const validationSchema: yup.SchemaOf<CustomTargetFormValues> = yup
    .object()
    .shape({
      name: yup
        .string()
        .trim()
        .required(t("validation.required"))
        .min(3, t("validation.minLength", { length: 3 }))
        .max(120, t("validation.maxLength", { length: 120 })),
      // .test(
      //   "Duplicate name",
      //   "An target with this name already exists. Please use a different name.",
      //   (value) =>
      //     duplicateNameCheck(customTargets, customTarget || null, value || "")
      // ),
      description: yup
        .string()
        .defined()
        .trim()
        .max(250, t("validation.maxLength", { length: 250 })),
      //TODO image validation
      image: yup
        .string()
        .defined()
        .trim()
        .max(250, t("validation.maxLength", { length: 250 })),
      //TODO rules validation
      rules: yup.array().defined(),
      //TODO repo validation
      repository: yup.object().shape({}).defined(),
      //TODO identity validation
      identity: yup.string().defined(),
    });

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    getValues,
    setValue,
    control,
    reset,
  } = useForm<CustomTargetFormValues>({
    defaultValues: useMemo<CustomTargetFormValues>(
      () => ({
        name: customTarget.name || "",
        description: customTarget.description || "",
        image: customTarget.image || "",
        rules: customTarget.rules || [],
        repository: customTarget.repository,
      }),
      [
        //TODO add customTarget to dep array
      ]
    ),
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  const values = getValues();

  const onCustomTargetSubmitComplete = () => {
    reset(values);
  };

  const {
    mutate: submitCustomTarget,
    isLoading,
    error,
  } = useUpdateCustomTargetMutation(onCustomTargetSubmitComplete);

  const onSubmit: SubmitHandler<CustomTargetFormValues> = (formValues) => {
    // const customTargetPayload: CustomTarget = {
    // };
    //   submitCustomTarget(customTargetPayload);
  };

  return (
    <Form className={spacing.mMd} onSubmit={handleSubmit(onSubmit)}>
      {error && (
        <Alert
          variant="danger"
          isInline
          title={getAxiosErrorMessage(error as AxiosError)}
        />
      )}
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
      />
      <ActionGroup>
        <Button
          type="submit"
          id="custom-target-form-submit"
          aria-label="submit"
          variant={ButtonVariant.primary}
          isDisabled={
            !isValid || isSubmitting || isValidating || isLoading || !isDirty
          }
        >
          {customTarget ? "Save" : "Update"}
        </Button>
      </ActionGroup>
    </Form>
  );
};
