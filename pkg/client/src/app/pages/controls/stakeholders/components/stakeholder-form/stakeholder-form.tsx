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
  TextInput,
} from "@patternfly/react-core";

import {
  SingleSelectFetchOptionValueFormikField,
  MultiSelectFetchOptionValueFormikField,
} from "@app/shared/components";
import {
  useFetchStakeholderGroups,
  useFetchJobFunctions,
} from "@app/shared/hooks";

import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { createStakeholder, updateStakeholder } from "@app/api/rest";
import { JobFunction, Stakeholder, StakeholderGroup } from "@app/api/models";
import {
  getAxiosErrorMessage,
  getValidatedFromError,
  getValidatedFromErrorTouched,
} from "@app/utils/utils";
import {
  IJobFunctionDropdown,
  toIJobFunctionDropdownOptionWithValue,
  toIJobFunctionDropdown,
  IStakeholderGroupDropdown,
  toIStakeholderGroupDropdownOptionWithValue,
  toIStakeholderGroupDropdown,
  isIModelEqual,
} from "@app/utils/model-utils";

export interface FormValues {
  email: string;
  displayName: string;
  jobFunction: IJobFunctionDropdown | null;
  stakeholderGroups: IStakeholderGroupDropdown[];
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

  const {
    jobFunctions,
    isFetching: isFetchingJobFunctions,
    fetchError: fetchErrorJobFunctions,
    fetchAllJobFunctions,
  } = useFetchJobFunctions();

  useEffect(() => {
    fetchAllJobFunctions();
  }, [fetchAllJobFunctions]);

  const {
    stakeholderGroups,
    isFetching: isFetchingGroups,
    fetchError: fetchErrorGroups,
    fetchAllStakeholderGroups,
  } = useFetchStakeholderGroups();

  useEffect(() => {
    fetchAllStakeholderGroups();
  }, [fetchAllStakeholderGroups]);

  const jobFunctionInitialValue: IJobFunctionDropdown | null = useMemo(() => {
    return stakeholder && stakeholder.jobFunction
      ? toIJobFunctionDropdown(stakeholder.jobFunction)
      : null;
  }, [stakeholder]);

  const stakeholderGroupsInitialValue: IStakeholderGroupDropdown[] =
    useMemo(() => {
      return stakeholder && stakeholder.stakeholderGroups
        ? stakeholder.stakeholderGroups.map(toIStakeholderGroupDropdown)
        : [];
    }, [stakeholder]);

  const initialValues: FormValues = {
    email: stakeholder?.email || "",
    displayName: stakeholder?.displayName || "",
    jobFunction: jobFunctionInitialValue,
    stakeholderGroups: stakeholderGroupsInitialValue,
  };

  const validationSchema = object().shape({
    email: string()
      .trim()
      .required(t("validation.required"))
      .min(3, t("validation.minLength", { length: 3 }))
      .max(120, t("validation.maxLength", { length: 120 }))
      .email(t("validation.email")),
    displayName: string()
      .trim()
      .required(t("validation.required"))
      .min(3, t("validation.minLength", { length: 3 }))
      .max(250, t("validation.maxLength", { length: 250 })),
  });

  const onSubmit = (
    formValues: FormValues,
    formikHelpers: FormikHelpers<FormValues>
  ) => {
    const payload: Stakeholder = {
      email: formValues.email.trim(),
      displayName: formValues.displayName.trim(),
      jobFunction: formValues.jobFunction as JobFunction,
      stakeholderGroups: formValues.stakeholderGroups as StakeholderGroup[],
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
          label={t("terms.email")}
          fieldId="email"
          isRequired={true}
          validated={getValidatedFromError(formik.errors.email)}
          helperTextInvalid={formik.errors.email}
        >
          <TextInput
            type="text"
            name="email"
            aria-label="email"
            aria-describedby="email"
            isRequired={true}
            onChange={onChangeField}
            onBlur={formik.handleBlur}
            value={formik.values.email}
            validated={getValidatedFromErrorTouched(
              formik.errors.email,
              formik.touched.email
            )}
          />
        </FormGroup>
        <FormGroup
          label={t("terms.displayName")}
          fieldId="displayName"
          isRequired={true}
          validated={getValidatedFromError(formik.errors.displayName)}
          helperTextInvalid={formik.errors.displayName}
        >
          <TextInput
            type="text"
            name="displayName"
            aria-label="displayName"
            aria-describedby="displayName"
            isRequired={true}
            onChange={onChangeField}
            onBlur={formik.handleBlur}
            value={formik.values.displayName}
            validated={getValidatedFromErrorTouched(
              formik.errors.displayName,
              formik.touched.displayName
            )}
          />
        </FormGroup>
        <FormGroup
          label={t("terms.jobFunction")}
          fieldId="jobFunction"
          isRequired={false}
          validated={getValidatedFromError(formik.errors.jobFunction)}
          helperTextInvalid={formik.errors.jobFunction}
        >
          <SingleSelectFetchOptionValueFormikField<JobFunction>
            fieldConfig={{ name: "jobFunction" }}
            selectConfig={{
              variant: "typeahead",
              "aria-label": "job-function",
              "aria-describedby": "job-function",
              typeAheadAriaLabel: "job-function",
              toggleAriaLabel: "job-function",
              clearSelectionsAriaLabel: "job-function",
              removeSelectionAriaLabel: "job-function",
              placeholderText: t("composed.selectOne", {
                what: t("terms.jobFunction").toLowerCase(),
              }),
              menuAppendTo: () => document.body,
              maxHeight: DEFAULT_SELECT_MAX_HEIGHT,
              isFetching: isFetchingJobFunctions,
              fetchError: fetchErrorJobFunctions,
            }}
            options={(jobFunctions?.data || []).map(toIJobFunctionDropdown)}
            toOptionWithValue={toIJobFunctionDropdownOptionWithValue}
          />
        </FormGroup>
        <FormGroup
          label={t("terms.group(s)")}
          fieldId="stakeholderGroups"
          isRequired={false}
          validated={getValidatedFromError(formik.errors.stakeholderGroups)}
          helperTextInvalid={formik.errors.stakeholderGroups}
        >
          <MultiSelectFetchOptionValueFormikField<IStakeholderGroupDropdown>
            fieldConfig={{ name: "stakeholderGroups" }}
            selectConfig={{
              variant: "typeaheadmulti",
              "aria-label": "stakeholder-groups",
              "aria-describedby": "stakeholder-groups",
              typeAheadAriaLabel: "stakeholder-groups",
              toggleAriaLabel: "stakeholder-groups",
              clearSelectionsAriaLabel: "stakeholder-groups",
              removeSelectionAriaLabel: "stakeholder-groups",
              placeholderText: t("composed.selectOne", {
                what: t("terms.group").toLowerCase(),
              }),
              menuAppendTo: () => document.body,
              maxHeight: DEFAULT_SELECT_MAX_HEIGHT,
              isFetching: isFetchingGroups,
              fetchError: fetchErrorGroups,
            }}
            options={(stakeholderGroups?.data || []).map(
              toIStakeholderGroupDropdown
            )}
            toOptionWithValue={toIStakeholderGroupDropdownOptionWithValue}
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
            {!stakeholder ? t("actions.create") : t("actions.save")}
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
