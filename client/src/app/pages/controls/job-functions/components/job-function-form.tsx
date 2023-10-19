import React from "react";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import { object, string } from "yup";

import {
  ActionGroup,
  Button,
  ButtonVariant,
  Form,
} from "@patternfly/react-core";

import { JobFunction, New } from "@app/api/models";
import { duplicateNameCheck } from "@app/utils/utils";
import {
  useCreateJobFunctionMutation,
  useFetchJobFunctions,
  useUpdateJobFunctionMutation,
} from "@app/queries/jobfunctions";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { HookFormPFTextInput } from "@app/components/HookFormPFFields";
import { NotificationsContext } from "@app/components/NotificationsContext";

export interface FormValues {
  name: string;
}

export interface JobFunctionFormProps {
  jobFunction: JobFunction | null;
  onClose: () => void;
}

export const JobFunctionForm: React.FC<JobFunctionFormProps> = ({
  jobFunction,
  onClose,
}) => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);
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
    mode: "all",
  });

  const onCreateJobFunctionSuccess = (data: JobFunction) => {
    pushNotification({
      title: t("toastr.success.createWhat", {
        type: t("terms.jobFunction"),
        what: data.name,
      }),
      variant: "success",
    });
    onClose();
  };

  const onUpdateJobFunctionSuccess = () => {
    pushNotification({
      title: t("toastr.success.save", {
        type: t("terms.jobFunction"),
      }),
      variant: "success",
    });
    onClose();
  };

  const onCreateJobFunctionError = (_error: AxiosError) => {
    pushNotification({
      title: t("toastr.fail.create", {
        type: t("terms.jobFunction").toLowerCase(),
      }),
      variant: "danger",
    });
  };

  const { mutate: createJobFunction } = useCreateJobFunctionMutation(
    onCreateJobFunctionSuccess,
    onCreateJobFunctionError
  );

  const onUpdateJobFunctionError = (_error: AxiosError) => {
    pushNotification({
      title: t("toastr.fail.save", {
        type: t("terms.jobFunction").toLowerCase(),
      }),
      variant: "danger",
    });
  };

  const { mutate: updateJobFunction } = useUpdateJobFunctionMutation(
    onUpdateJobFunctionSuccess,
    onUpdateJobFunctionError
  );

  const onSubmit = (formValues: FormValues) => {
    const payload: New<JobFunction> = {
      name: formValues.name.trim(),
    };

    if (jobFunction) {
      updateJobFunction({ id: jobFunction.id, ...payload });
    } else {
      createJobFunction(payload);
    }
    onClose();
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
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
          id="submit"
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
          onClick={onClose}
        >
          {t("actions.cancel")}
        </Button>
      </ActionGroup>
    </Form>
  );
};
