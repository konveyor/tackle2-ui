import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError, AxiosPromise, AxiosResponse } from "axios";
import { useFormik, FormikProvider, FormikHelpers } from "formik";
import { object, string } from "yup";

import {
  ActionGroup,
  Alert,
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  TextArea,
  TextInput,
} from "@patternfly/react-core";

import { MultiSelectFetchOptionValueFormikField } from "@app/shared/components";
import { useFetchStakeholders } from "@app/shared/hooks";

import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { createStakeholderGroup, updateStakeholderGroup } from "@app/api/rest";
import { Stakeholder, StakeholderGroup } from "@app/api/models";
import {
  getAxiosErrorMessage,
  getValidatedFromError,
  getValidatedFromErrorTouched,
} from "@app/utils/utils";
import {
  isIModelEqual,
  IStakeholderDropdown,
  toIStakeholderDropdownOptionWithValue,
  toIStakeholderDropdown,
} from "@app/utils/model-utils";

export interface FormValues {
  name: string;
  description: string;
  stakeholders: IStakeholderDropdown[];
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
    fetchAllStakeholders,
  } = useFetchStakeholders();

  useEffect(() => {
    fetchAllStakeholders();
  }, [fetchAllStakeholders]);

  const stakeholdersInitialValue: IStakeholderDropdown[] = useMemo(() => {
    return stakeholderGroup && stakeholderGroup.stakeholders
      ? stakeholderGroup.stakeholders.map(toIStakeholderDropdown)
      : [];
  }, [stakeholderGroup]);

  const initialValues: FormValues = {
    name: stakeholderGroup?.name || "",
    description: stakeholderGroup?.description || "",
    stakeholders: stakeholdersInitialValue,
  };

  const validationSchema = object().shape({
    name: string()
      .trim()
      .required(t("validation.required"))
      .min(3, t("validation.minLength", { length: 3 }))
      .max(120, t("validation.maxLength", { length: 120 })),
    description: string()
      .trim()
      .max(250, t("validation.maxLength", { length: 250 })),
  });

  const onSubmit = (
    formValues: FormValues,
    formikHelpers: FormikHelpers<FormValues>
  ) => {
    const payload: StakeholderGroup = {
      name: formValues.name.trim(),
      description: formValues.description.trim(),
      stakeholders: formValues.stakeholders as Stakeholder[],
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
        formikHelpers.setSubmitting(false);
        onSaved(response);
      })
      .catch((error) => {
        formikHelpers.setSubmitting(false);
        setError(error);
      });
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: initialValues,
    validationSchema: validationSchema,
    onSubmit: onSubmit,
  });

  const onChangeField = (value: string, event: React.FormEvent<any>) => {
    formik.handleChange(event);
  };

  return (
    <FormikProvider value={formik}>
      <Form onSubmit={formik.handleSubmit}>
        {error && (
          <Alert
            variant="danger"
            isInline
            title={getAxiosErrorMessage(error)}
          />
        )}
        <FormGroup
          label={t("terms.name")}
          fieldId="name"
          isRequired={true}
          validated={getValidatedFromError(formik.errors.name)}
          helperTextInvalid={formik.errors.name}
        >
          <TextInput
            type="text"
            name="name"
            aria-label="name"
            aria-describedby="name"
            isRequired={true}
            onChange={onChangeField}
            onBlur={formik.handleBlur}
            value={formik.values.name}
            validated={getValidatedFromErrorTouched(
              formik.errors.name,
              formik.touched.name
            )}
          />
        </FormGroup>
        <FormGroup
          label={t("terms.description")}
          fieldId="description"
          isRequired={false}
          validated={getValidatedFromError(formik.errors.description)}
          helperTextInvalid={formik.errors.description}
        >
          <TextArea
            type="text"
            name="description"
            aria-label="description"
            aria-describedby="description"
            isRequired={false}
            onChange={onChangeField}
            onBlur={formik.handleBlur}
            value={formik.values.description}
            validated={getValidatedFromErrorTouched(
              formik.errors.description,
              formik.touched.description
            )}
          />
        </FormGroup>
        <FormGroup
          label={t("terms.member(s)")}
          fieldId="stakeholders"
          isRequired={false}
          validated={getValidatedFromError(formik.errors.stakeholders)}
          helperTextInvalid={formik.errors.stakeholders}
        >
          <MultiSelectFetchOptionValueFormikField<IStakeholderDropdown>
            fieldConfig={{ name: "stakeholders" }}
            selectConfig={{
              variant: "typeaheadmulti",
              "aria-label": "stakeholders",
              "aria-describedby": "stakeholders",
              typeAheadAriaLabel: "stakeholders",
              toggleAriaLabel: "stakeholders",
              clearSelectionsAriaLabel: "stakeholders",
              removeSelectionAriaLabel: "stakeholders",
              placeholderText: t("composed.selectOne", {
                what: t("terms.member").toLowerCase(),
              }),
              menuAppendTo: () => document.body,
              maxHeight: DEFAULT_SELECT_MAX_HEIGHT,
              isFetching: isFetchingStakeholders,
              fetchError: fetchErrorStakeholders,
            }}
            options={(stakeholders?.data || []).map(toIStakeholderDropdown)}
            toOptionWithValue={toIStakeholderDropdownOptionWithValue}
            isEqual={isIModelEqual}
          />
        </FormGroup>

        <ActionGroup>
          <Button
            type="submit"
            aria-label="submit"
            variant={ButtonVariant.primary}
            isDisabled={
              !formik.isValid ||
              !formik.dirty ||
              formik.isSubmitting ||
              formik.isValidating
            }
          >
            {!stakeholderGroup ? t("actions.create") : t("actions.save")}
          </Button>
          <Button
            type="button"
            aria-label="cancel"
            variant={ButtonVariant.link}
            isDisabled={formik.isSubmitting || formik.isValidating}
            onClick={onCancel}
          >
            {t("actions.cancel")}
          </Button>
        </ActionGroup>
      </Form>
    </FormikProvider>
  );
};
