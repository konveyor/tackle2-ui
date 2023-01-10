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

import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { createStakeholder, updateStakeholder } from "@app/api/rest";
import { JobFunction, Stakeholder, StakeholderGroup } from "@app/api/models";
import {
  duplicateFieldCheck,
  duplicateNameCheck,
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
import { useFetchStakeholders } from "@app/queries/stakeholders";
import { useFetchStakeholderGroups } from "@app/queries/stakeholdergoups";
import { useFetchJobFunctions } from "@app/queries/jobfunctions";

export interface FormValues {
  email: string;
  name: string;
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

  const { stakeholders } = useFetchStakeholders();

  const {
    jobFunctions,
    isFetching: isFetchingJobFunctions,
    fetchError: fetchErrorJobFunctions,
  } = useFetchJobFunctions();

  const {
    stakeholderGroups,
    isFetching: isFetchingGroups,
    fetchError: fetchErrorGroups,
  } = useFetchStakeholderGroups();

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
    name: stakeholder?.name || "",
    jobFunction: jobFunctionInitialValue,
    stakeholderGroups: stakeholderGroupsInitialValue,
  };

  const validationSchema = object().shape({
    email: string()
      .trim()
      .required(t("validation.required"))
      .min(3, t("validation.minLength", { length: 3 }))
      .max(120, t("validation.maxLength", { length: 120 }))
      .email(t("validation.email"))
      .test(
        "Duplicate email",
        "A stakeholder with this email address already exists. Please use a different email address.",
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
        "A stakeholder with this name already exists. Please use a different name.",
        (value) =>
          duplicateNameCheck(stakeholders, stakeholder || null, value || "")
      ),
  });

  const onSubmit = (
    formValues: FormValues,
    formikHelpers: FormikHelpers<FormValues>
  ) => {
    const payload: Stakeholder = {
      email: formValues.email.trim(),
      name: formValues.name.trim(),
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
            id="email"
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
          label={t("terms.name")}
          fieldId="name"
          isRequired={true}
          validated={getValidatedFromError(formik.errors.name)}
          helperTextInvalid={formik.errors.name}
        >
          <TextInput
            type="text"
            name="name"
            id="name"
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
          label={t("terms.jobFunction")}
          fieldId="jobFunction"
          isRequired={false}
          validated={getValidatedFromError(formik.errors.jobFunction)}
          helperTextInvalid={formik.errors.jobFunction}
        >
          <SingleSelectFetchOptionValueFormikField<JobFunction>
            fieldConfig={{ name: "jobFunction" }}
            selectConfig={{
              toggleId: "job-function-toggle",
              variant: "typeahead",
              "aria-label": "Job function",
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
            options={(jobFunctions || []).map(toIJobFunctionDropdown)}
            toOptionWithValue={toIJobFunctionDropdownOptionWithValue}
          />
        </FormGroup>
        <FormGroup
          label={t("terms.stakeholderGroup")}
          fieldId="stakeholderGroups"
          isRequired={false}
          validated={getValidatedFromError(formik.errors.stakeholderGroups)}
          helperTextInvalid={formik.errors.stakeholderGroups}
        >
          <MultiSelectFetchOptionValueFormikField<IStakeholderGroupDropdown>
            fieldConfig={{ name: "stakeholderGroups" }}
            selectConfig={{
              variant: "typeaheadmulti",
              toggleId: "stakeholder-groups-toggle",
              "aria-label": "Stakeholder groups",
              "aria-describedby": "stakeholder-groups",
              typeAheadAriaLabel: "stakeholder-groups",
              toggleAriaLabel: "stakeholder-groups",
              clearSelectionsAriaLabel: "stakeholder-groups",
              removeSelectionAriaLabel: "stakeholder-groups",
              placeholderText: t("composed.selectOne", {
                what: t("terms.stakeholderGroup").toLowerCase(),
              }),
              menuAppendTo: () => document.body,
              maxHeight: DEFAULT_SELECT_MAX_HEIGHT,
              isFetching: isFetchingGroups,
              fetchError: fetchErrorGroups,
            }}
            options={(stakeholderGroups || []).map(toIStakeholderGroupDropdown)}
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
