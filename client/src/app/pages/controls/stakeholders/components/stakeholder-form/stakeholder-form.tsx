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

import { createStakeholder, updateStakeholder } from "@app/api/rest";
import { JobFunction, Ref, Stakeholder } from "@app/api/models";
import {
  duplicateFieldCheck,
  duplicateNameCheck,
  getAxiosErrorMessage,
} from "@app/utils/utils";
import { toOptionLike } from "@app/utils/model-utils";
import { useFetchStakeholders } from "@app/queries/stakeholders";
import { useFetchStakeholderGroups } from "@app/queries/stakeholdergoups";
import { useFetchJobFunctions } from "@app/queries/jobfunctions";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/shared/components/hook-form-pf-fields";
import { OptionWithValue, SimpleSelect } from "@app/shared/components";

export interface FormValues {
  email: string;
  name: string;
  jobFunctionName?: string;
  stakeholderGroupNames?: string[];
}

export interface StakeholderFormProps {
  stakeholder?: Stakeholder;
  onSaved: (response: AxiosResponse<Stakeholder>) => void;
  onCancel: () => void;
}

export const StakeholderForm: React.FC<StakeholderFormProps> = ({
  stakeholder,
  onSaved,
  onCancel,
}) => {
  const { t } = useTranslation();

  const [error, setError] = useState<AxiosError>();

  const { stakeholders } = useFetchStakeholders();

  const { jobFunctions } = useFetchJobFunctions();

  const { stakeholderGroups } = useFetchStakeholderGroups();

  const jobFunctionOptions = jobFunctions.map((jobFunction) => {
    return {
      value: jobFunction.name,
      toString: () => jobFunction.name,
    };
  });
  const stakeholderGroupOptions = stakeholderGroups.map((stakeholderGroup) => {
    return {
      value: stakeholderGroup.name,
      toString: () => stakeholderGroup.name,
    };
  });

  const validationSchema = object().shape({
    email: string()
      .trim()
      .required(t("validation.required"))
      .min(3, t("validation.minLength", { length: 3 }))
      .max(120, t("validation.maxLength", { length: 120 }))
      .email(t("validation.email"))
      .test(
        "Duplicate email",
        "A stakeholder with this email address already exists. Use a different email address.",
        (value) =>
          duplicateFieldCheck(
            "email",
            stakeholders,
            stakeholder || null,
            value || ""
          )
      ),
    name: string()
      .trim()
      .required(t("validation.required"))
      .min(3, t("validation.minLength", { length: 3 }))
      .max(120, t("validation.maxLength", { length: 120 }))
      .test(
        "Duplicate name",
        "A stakeholder with this name already exists. Use a different name.",
        (value) =>
          duplicateNameCheck(stakeholders, stakeholder || null, value || "")
      ),
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    getValues,
    control,
  } = useForm<FormValues>({
    defaultValues: {
      email: stakeholder?.email || "",
      name: stakeholder?.name || "",
      jobFunctionName: stakeholder?.jobFunction?.name,
      stakeholderGroupNames: stakeholder?.stakeholderGroups?.map(
        (stakeholderGroup) => stakeholderGroup.name
      ),
    },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  const values = getValues();

  const onSubmit = (formValues: FormValues) => {
    const matchingStakeholderGroupRefs: Ref[] = stakeholderGroups
      .filter((stakeholderGroup) =>
        formValues?.stakeholderGroupNames?.includes(stakeholderGroup.name)
      )
      .map((stakeholderGroup) => {
        return {
          id: stakeholderGroup.id,
          name: stakeholderGroup.name,
        };
      });

    const payload: Stakeholder = {
      email: formValues.email.trim(),
      name: formValues.name.trim(),
      jobFunction: jobFunctions.find(
        (jobFunction) => jobFunction.name === formValues.jobFunctionName
      ),
      stakeholderGroups: matchingStakeholderGroupRefs,
    };

    let promise: AxiosPromise<Stakeholder>;
    if (stakeholder) {
      promise = updateStakeholder({
        ...stakeholder,
        ...payload,
      });
    } else {
      promise = createStakeholder(payload);
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
        name="email"
        label={t("terms.email")}
        fieldId="email"
        isRequired
      />
      <HookFormPFTextInput
        control={control}
        name="name"
        label={t("terms.name")}
        fieldId="name"
        isRequired
      />
      <HookFormPFGroupController
        control={control}
        name="jobFunctionName"
        label={t("terms.jobFunction")}
        fieldId="jobFunction"
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelect
            variant="typeahead"
            id="job-function"
            toggleId="job-function-toggle"
            toggleAriaLabel="Job function select dropdown toggle"
            aria-label={name}
            value={value ? toOptionLike(value, jobFunctionOptions) : undefined}
            options={jobFunctionOptions}
            onChange={(selection) => {
              const selectionValue = selection as OptionWithValue<JobFunction>;
              onChange(selectionValue.value);
            }}
          />
        )}
      />
      <HookFormPFGroupController
        control={control}
        name="stakeholderGroupNames"
        label={t("terms.stakeholderGroup")}
        fieldId="stakeholderGroups"
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelect
            variant="typeaheadmulti"
            id="stakeholder-groups"
            toggleId="stakeholder-groups-toggle"
            toggleAriaLabel="Stakeholder groups select dropdown toggle"
            aria-label={name}
            value={
              value
                ? value.map((value) =>
                    toOptionLike(value, stakeholderGroupOptions)
                  )
                : undefined
            }
            options={stakeholderGroupOptions}
            onChange={(selection) => {
              const currentValue = value || [];
              const selectionWithValue = selection as OptionWithValue<string>;
              const e = currentValue.find(
                (f) => f === selectionWithValue.value
              );
              if (e) {
                onChange(
                  currentValue.filter((f) => f !== selectionWithValue.value)
                );
              } else {
                onChange([...currentValue, selectionWithValue.value]);
              }
            }}
          />
        )}
      />
      <ActionGroup>
        <Button
          type="submit"
          aria-label="submit"
          id="stakeholder-form-submit"
          variant={ButtonVariant.primary}
          isDisabled={!isValid || isSubmitting || isValidating || !isDirty}
        >
          {!stakeholder ? t("actions.create") : t("actions.save")}
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
