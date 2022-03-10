import React, { useEffect, useMemo, useState } from "react";
import axios, { AxiosError, AxiosPromise, AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";

import {
  ActionGroup,
  Alert,
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  TextInput,
} from "@patternfly/react-core";

import { useDispatch } from "react-redux";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { Application, Ref } from "@app/api/models";
import { c_options_menu__toggle_active_BorderBottomColor } from "@patternfly/react-tokens";
import { SingleSelectFetchOptionValueFormikField } from "@app/shared/components";
import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { useFetchIdentities } from "@app/shared/hooks/useFetchIdentities";
import {
  getKindIDByRef,
  IdentityDropdown,
  toIdentityDropdown,
  toIdentityDropdownOptionWithValue,
} from "@app/utils/model-utils";
import { useFormik, FormikProvider, FormikHelpers } from "formik";
import {
  APPLICATION_NAME,
  MAVEN_SETTINGS,
  SOURCE_CREDENTIALS,
} from "./field-names";
import validationSchema from "./validation-schema";
import { updateApplication } from "@app/api/rest";

export interface FormValues {
  applicationName: string;
  sourceCredentials: IdentityDropdown;
  mavenSettings: IdentityDropdown;
}

export interface ApplicationIdentityFormProps {
  application: Application;
  onSaved: (response: AxiosResponse) => void;
  onCancel: () => void;
}

export const ApplicationIdentityForm: React.FC<
  ApplicationIdentityFormProps
> = ({ application, onSaved, onCancel }) => {
  const { t } = useTranslation();
  console.log("apps", application);
  const [error, setError] = useState<AxiosError>();

  // Redux
  const dispatch = useDispatch();

  const {
    identities,
    isFetching,
    fetchError: fetchErrorIdentities,
    fetchIdentities,
  } = useFetchIdentities();

  useEffect(() => {
    fetchIdentities();
  }, [fetchIdentities]);

  // Actions

  const onSubmit = (
    formValues: FormValues
    // formikHelpers: FormikHelpers<FormValues>
  ) => {
    debugger;
    console.log("submit");
    const doesMavenSettingExist = application.identities?.some(
      (i) => i.id === formValues.mavenSettings.id
    );
    const doesSourceSettingExist = application.identities?.some(
      (i) => i.id === formValues.sourceCredentials.id
    );
    let updatedIdentities: Ref[] = [];
    if (application.identities) {
      const identitiesCopy: Ref[] = [...application.identities];
      updatedIdentities = [
        ...identitiesCopy,
        ...(!doesSourceSettingExist ? [formValues.sourceCredentials] : []),
        ...(!doesMavenSettingExist ? [formValues.mavenSettings] : []),
      ];
    }
    if (updatedIdentities.length && application) {
      const payload: Application = {
        name: formValues.applicationName.trim(),
        identities: updatedIdentities,
        id: application.id,
        businessService: application.businessService,
      };
      let promise: AxiosPromise<Application>;
      promise = updateApplication({
        ...payload,
      });
      promise
        .then((response) => {
          formik.setSubmitting(false);
          onSaved(response);
        })
        .catch((error) => {
          formik.setSubmitting(false);
          setError(error);
        });
    }
  };

  const sourceCredentialsInitialValue = useMemo(() => {
    let result: IdentityDropdown = { id: 0, name: "" };
    if (application && identities) {
      const matchingID = getKindIDByRef(identities, application, "source");
      if (matchingID) {
        result = toIdentityDropdown(matchingID);
      }
    }
    return result;
  }, [identities, application]);

  const mavenSettingsInitialValue = useMemo(() => {
    let result: IdentityDropdown = { id: 0, name: "" };
    if (application && identities) {
      const matchingID = getKindIDByRef(identities, application, "maven");
      if (matchingID) {
        result = toIdentityDropdown(matchingID);
      }
    }
    return result;
  }, [identities, application]);

  const initialValues: FormValues = {
    [APPLICATION_NAME]: application?.name || "",
    [SOURCE_CREDENTIALS]: sourceCredentialsInitialValue,
    [MAVEN_SETTINGS]: mavenSettingsInitialValue,
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: initialValues,
    validationSchema: validationSchema({
      [APPLICATION_NAME]: true,
      [SOURCE_CREDENTIALS]: true,
      [MAVEN_SETTINGS]: true,
    }),
    onSubmit: onSubmit,
  });

  const onChangeField = (value: string, event: React.FormEvent<any>) => {
    formik.handleChange(event);
  };

  return (
    <FormikProvider value={formik}>
      <Form>
        {error && (
          <Alert variant="danger" title={getAxiosErrorMessage(error)} />
        )}
        <TextInput
          value={application.name}
          type="text"
          aria-label="Manage credentials selected applications"
          isReadOnly
        />
        <FormGroup
          label="Source credentials"
          isRequired
          fieldId={SOURCE_CREDENTIALS}
        >
          <SingleSelectFetchOptionValueFormikField
            fieldConfig={{ name: SOURCE_CREDENTIALS }}
            selectConfig={{
              variant: "typeahead",
              "aria-label": "sourceCredentials",
              "aria-describedby": "sourceCredentials",
              typeAheadAriaLabel: "sourceCredentials",
              toggleAriaLabel: "sourceCredentials",
              clearSelectionsAriaLabel: "sourceCredentials",
              removeSelectionAriaLabel: "sourceCredentials",
              placeholderText: "",
              menuAppendTo: () => document.body,
              maxHeight: DEFAULT_SELECT_MAX_HEIGHT,
              fetchError: undefined,
              isFetching: false,
            }}
            options={(identities?.filter((i) => i.kind === "source") || []).map(
              toIdentityDropdown
            )}
            toOptionWithValue={toIdentityDropdownOptionWithValue}
          />
        </FormGroup>
        <FormGroup label="Maven settings" isRequired fieldId={MAVEN_SETTINGS}>
          <SingleSelectFetchOptionValueFormikField
            fieldConfig={{ name: MAVEN_SETTINGS }}
            selectConfig={{
              variant: "typeahead",
              "aria-label": "mavenSettings",
              "aria-describedby": "mavenSettings",
              typeAheadAriaLabel: "mavenSettings",
              toggleAriaLabel: "mavenSettings",
              clearSelectionsAriaLabel: "mavenSettings",
              removeSelectionAriaLabel: "mavenSettings",
              placeholderText: "",
              menuAppendTo: () => document.body,
              maxHeight: DEFAULT_SELECT_MAX_HEIGHT,
              fetchError: undefined,
              isFetching: false,
            }}
            options={(identities?.filter((i) => i.kind === "maven") || []).map(
              toIdentityDropdown
            )}
            toOptionWithValue={toIdentityDropdownOptionWithValue}
          />
        </FormGroup>
        <ActionGroup>
          <Button
            type="submit"
            aria-label="submit"
            onClick={(e) => {
              e.preventDefault();
              onSubmit(formik.values);
            }}
            variant={ButtonVariant.primary}
            isDisabled={
              !formik.isValid ||
              !formik.dirty ||
              formik.isSubmitting ||
              formik.isValidating
            }
          >
            {t("actions.save")}
          </Button>
          <Button
            type="button"
            aria-label="cancel"
            variant={ButtonVariant.link}
            onClick={onCancel}
          >
            {t("actions.cancel")}
          </Button>
        </ActionGroup>
      </Form>
    </FormikProvider>
  );
};
