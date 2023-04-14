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

import { OptionWithValue, SimpleSelect } from "@app/shared/components";

import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { createStakeholderGroup, updateStakeholderGroup } from "@app/api/rest";
import { Ref, StakeholderGroup } from "@app/api/models";
import { duplicateNameCheck, getAxiosErrorMessage } from "@app/utils/utils";
import { toOptionLike } from "@app/utils/model-utils";
import { useFetchStakeholders } from "@app/queries/stakeholders";
import { useFetchStakeholderGroups } from "@app/queries/stakeholdergoups";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  HookFormPFGroupController,
  HookFormPFTextArea,
  HookFormPFTextInput,
} from "@app/shared/components/hook-form-pf-fields";

export interface FormValues {
  name: string;
  description: string;
  stakeholderNames: string[];
}

export interface StakeholderGroupFormProps {
  stakeholderGroup?: StakeholderGroup;
  onSaved: (response: AxiosResponse<StakeholderGroup>) => void;
  onCancel: () => void;
}

export const StakeholderGroupForm: React.FC<StakeholderGroupFormProps> = ({
  stakeholderGroup,
  onSaved,
  onCancel,
}) => {
  const { t } = useTranslation();

  const [error, setError] = useState<AxiosError>();

  const {
    stakeholders,
    isFetching: isFetchingStakeholders,
    fetchError: fetchErrorStakeholders,
  } = useFetchStakeholders();

  const {
    stakeholderGroups,
    isFetching: isFetchingStakeholderGroups,
    fetchError: fetchErrorStakeholderGroups,
  } = useFetchStakeholderGroups();

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
        "An stakeholder group with this name already exists. Use a different name.",
        (value) => {
          return duplicateNameCheck(
            stakeholderGroups || [],
            stakeholderGroup || null,
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
    getValues,
    setValue,
    control,
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      name: stakeholderGroup?.name || "",
      description: stakeholderGroup?.description || "",
      stakeholderNames: stakeholderGroup?.stakeholders?.map(
        (stakeholder) => stakeholder.name
      ),
    },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  const onSubmit = (formValues: FormValues) => {
    const matchingStakeholderRefs: Ref[] = stakeholders
      .filter((stakeholder) =>
        formValues?.stakeholderNames?.includes(stakeholder.name)
      )
      .map((stakeholder) => {
        return {
          id: stakeholder.id,
          name: stakeholder.name,
        };
      });

    const payload: StakeholderGroup = {
      name: formValues.name.trim(),
      description: formValues.description.trim(),
      stakeholders: matchingStakeholderRefs,
    };

    let promise: AxiosPromise<StakeholderGroup>;
    if (stakeholderGroup) {
      promise = updateStakeholderGroup({
        ...stakeholderGroup,
        ...payload,
      });
    } else {
      promise = createStakeholderGroup(payload);
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
        fieldId=""
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
        name="stakeholderNames"
        label={t("terms.member(s)")}
        fieldId="stakeholders"
        isRequired
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelect
            variant="typeaheadmulti"
            maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
            id="stakeholders"
            toggleId="stakeholders-toggle"
            toggleAriaLabel="Stakeholders select dropdown toggle"
            aria-label={name}
            value={
              value
                ? value.map((value) => toOptionLike(value, stakeholdersOptions))
                : undefined
            }
            options={stakeholdersOptions}
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
          id="stakeholder-group-form-submit"
          aria-label="submit"
          variant={ButtonVariant.primary}
          isDisabled={!isValid || isSubmitting || isValidating || !isDirty}
        >
          {!stakeholderGroup ? t("actions.create") : t("actions.save")}
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
