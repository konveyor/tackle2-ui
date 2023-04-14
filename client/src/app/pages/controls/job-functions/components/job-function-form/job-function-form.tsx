import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError, AxiosPromise, AxiosResponse } from "axios";
import { object, string } from "yup";

import {
  ActionGroup,
  Alert,
  Button,
  ButtonVariant,
  Form,
} from "@patternfly/react-core";

import { createJobFunction, updateJobFunction } from "@app/api/rest";
import { JobFunction } from "@app/api/models";
import { duplicateNameCheck, getAxiosErrorMessage } from "@app/utils/utils";
import { useFetchJobFunctions } from "@app/queries/jobfunctions";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { HookFormPFTextInput } from "@app/shared/components/hook-form-pf-fields";

export interface FormValues {
  name: string;
}

export interface JobFunctionFormProps {
  jobFunction?: JobFunction;
  onSaved: (response: AxiosResponse<JobFunction>) => void;
  onCancel: () => void;
}

export const JobFunctionForm: React.FC<JobFunctionFormProps> = ({
  jobFunction,
  onSaved,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [error, setError] = useState<AxiosError>();
  const { jobFunctions } = useFetchJobFunctions();

  const validationSchema = object().shape({
    name: string()
      .trim()
      .required(t("validation.required"))
      .min(3, t("validation.minLength", { length: 3 }))
      .max(120, t("validation.maxLength", { length: 120 }))
      .test(
        "Duplicate name",
        "A job function with this name already exists. Use a different name.",
        (value) => {
          return duplicateNameCheck(
            jobFunctions || [],
            jobFunction || null,
            value || ""
          );
        }
      ),
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    control,
  } = useForm<FormValues>({
    defaultValues: {
      name: jobFunction?.name || "",
    },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  const onSubmit = (formValues: FormValues) => {
    const payload: JobFunction = {
      name: formValues.name.trim(),
    };

    let promise: AxiosPromise<JobFunction>;
    if (jobFunction) {
      promise = updateJobFunction({
        ...jobFunction,
        ...payload,
      });
    } else {
      promise = createJobFunction(payload);
    }

    promise
      .then((response) => {
        onSaved(response);
      })
      .catch((error) => {
        setError(error);
      });
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      {error && (
        <Alert variant="danger" isInline title={getAxiosErrorMessage(error)} />
      )}
      <HookFormPFTextInput
        control={control}
        name="name"
        label={t("terms.name")}
        fieldId="name"
        isRequired
      />
      <ActionGroup>
        <Button
          type="submit"
          id="job-function-form-submit"
          aria-label="submit"
          variant={ButtonVariant.primary}
          isDisabled={!isValid || isSubmitting || isValidating || !isDirty}
        >
          {!jobFunction ? t("actions.create") : t("actions.save")}
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
