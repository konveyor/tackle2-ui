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

import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { createBusinessService, updateBusinessService } from "@app/api/rest";
import { BusinessService, Stakeholder } from "@app/api/models";
import { duplicateNameCheck, getAxiosErrorMessage } from "@app/utils/utils";
import { useFetchStakeholders } from "@app/queries/stakeholders";
import { useFetchBusinessServices } from "@app/queries/businessservices";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  HookFormPFGroupController,
  HookFormPFTextArea,
  HookFormPFTextInput,
} from "@app/shared/components/hook-form-pf-fields";
import { OptionWithValue, SimpleSelect } from "@app/shared/components";

export interface FormValues {
  name: string;
  description: string;
  owner: string;
}

export interface BusinessServiceFormProps {
  businessService?: BusinessService;
  onSaved: (response: AxiosResponse<BusinessService>) => void;
  onCancel: () => void;
}

export const BusinessServiceForm: React.FC<BusinessServiceFormProps> = ({
  businessService,
  onSaved,
  onCancel,
}) => {
  const { t } = useTranslation();

  const [error, setError] = useState<AxiosError>();

  const { businessServices } = useFetchBusinessServices();

  const { stakeholders } = useFetchStakeholders();

  const stakeholdersOptions = stakeholders.map((stakeholder) => {
    return {
      value: stakeholder.name,
      toString: () => stakeholder.name,
    };
  });

  const validationSchema = object().shape({
    name: string()
      .trim()
      .required(t("validation.required"))
      .min(3, t("validation.minLength", { length: 3 }))
      .max(120, t("validation.maxLength", { length: 120 }))
      .test(
        "Duplicate name",
        "A business service with this name already exists. Use a different name.",
        (value) => {
          return duplicateNameCheck(
            businessServices || [],
            businessService || null,
            value || ""
          );
        }
      ),
    description: string()
      .trim()
      .max(250, t("validation.maxLength", { length: 250 })),
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    control,
  } = useForm<FormValues>({
    defaultValues: {
      name: businessService?.name || "",
      description: businessService?.description || "",
      owner: businessService?.owner?.name,
    },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  const onSubmit = (formValues: FormValues) => {
    const matchingStakeholderRef = stakeholders.find(
      (stakeholder) => stakeholder.name === formValues.owner
    );
    const payload: BusinessService = {
      name: formValues.name.trim(),
      description: formValues.description.trim(),
      owner: matchingStakeholderRef,
    };

    let promise: AxiosPromise<BusinessService>;
    if (businessService) {
      promise = updateBusinessService({
        ...businessService,
        ...payload,
      });
    } else {
      promise = createBusinessService(payload);
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
        fieldId="business-service-name"
        isRequired
      />
      <HookFormPFTextArea
        control={control}
        name="description"
        label={t("terms.description")}
        fieldId="description"
      />
      <HookFormPFGroupController
        control={control}
        name="owner"
        label={t("terms.owner")}
        fieldId="owner"
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelect
            variant="typeahead"
            maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
            id="action-select"
            toggleId="action-select-toggle"
            toggleAriaLabel="Action select dropdown toggle"
            aria-label={name}
            value={value}
            options={stakeholdersOptions}
            onChange={(selection) => {
              const selectionValue = selection as OptionWithValue<string>;
              onChange(selectionValue.value);
            }}
            onClear={() => onChange([])}
          />
        )}
      />
      <ActionGroup>
        <Button
          type="submit"
          id="business-service-form-submit"
          aria-label="submit"
          variant={ButtonVariant.primary}
          isDisabled={!isValid || isSubmitting || isValidating || !isDirty}
        >
          {!businessService ? t("actions.create") : t("actions.save")}
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
