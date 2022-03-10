import React, { useEffect, useMemo, useState } from "react";
import { AxiosError, AxiosPromise, AxiosResponse } from "axios";
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
import { Application, Identity, Ref } from "@app/api/models";
import { SingleSelectFetchOptionValueFormikField } from "@app/shared/components";
import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { useFetchIdentities } from "@app/shared/hooks/useFetchIdentities";
import {
  getKindIDByRef,
  IdentityDropdown,
  toIdentityDropdown,
  toIdentityDropdownOptionWithValue,
} from "@app/utils/model-utils";
import { useFormik, FormikProvider } from "formik";
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
  applications: Application[];
  onSaved: (response: AxiosResponse) => void;
  onCancel: () => void;
}

export const ApplicationIdentityForm: React.FC<
  ApplicationIdentityFormProps
> = ({ applications, onSaved, onCancel }) => {
  const { t } = useTranslation();
  console.log("apps", applications);
  const [error, setError] = useState<AxiosError>();

  const { identities, fetchIdentities } = useFetchIdentities();

  useEffect(() => {
    fetchIdentities();
  }, [fetchIdentities]);

  // Actions

  const onSubmit = (formValues: FormValues) => {
    let updatePromises: Array<AxiosPromise<Application>> = [];
    applications.forEach((application) => {
      let updatedIdentities: Ref[] = [];
      if (application.identities && identities) {
        let newSourceCredentials;
        const { sourceCredentials } = formValues;
        if (sourceCredentials.id) {
          newSourceCredentials = sourceCredentials;
          updatedIdentities.push(newSourceCredentials);
        }
        let newMavenSettings;
        const { mavenSettings } = formValues;
        if (mavenSettings.id) {
          newMavenSettings = mavenSettings;
          updatedIdentities.push(newMavenSettings);
        }
      }
      if (application) {
        const payload: Application = {
          name: application.name,
          identities: updatedIdentities,
          id: application.id,
          businessService: application.businessService,
        };
        let promise: AxiosPromise<Application>;
        promise = updateApplication({
          ...payload,
        });
        updatePromises.push(promise);
      }
    });
    Promise.all(updatePromises)
      .then((response) => {
        formik.setSubmitting(false);
        //All promises resolved successfully
        onSaved(response[0]);
      })
      .catch((error) => {
        //One or many promises failed
        formik.setSubmitting(false);
        setError(error);
      });
  };
  const emptyIdentity = { id: 0, name: "None", kind: "", createUser: "" };

  let mavenIdentityOptions: Identity[] =
    identities?.filter((i) => i.kind === "maven") || [];
  mavenIdentityOptions.unshift(emptyIdentity);
  mavenIdentityOptions.map(toIdentityDropdown);

  let sourceIdentityOptions: Identity[] =
    identities?.filter((i) => i.kind === "source") || [];
  sourceIdentityOptions.unshift(emptyIdentity);
  sourceIdentityOptions.map(toIdentityDropdown);

  const sourceCredentialsInitialValue = useMemo(() => {
    let result: IdentityDropdown = { id: 0, name: "" };
    if (applications && identities) {
      const matchingID = getKindIDByRef(identities, applications[0], "source");
      if (matchingID) {
        result = toIdentityDropdown(matchingID);
      } else {
        result = emptyIdentity;
      }
    }
    return result;
  }, [identities, applications]);

  const mavenSettingsInitialValue = useMemo(() => {
    let result: IdentityDropdown = { id: 0, name: "" };
    if (applications && identities) {
      const matchingID = getKindIDByRef(identities, applications[0], "maven");
      if (matchingID) {
        result = toIdentityDropdown(matchingID);
      } else {
        result = emptyIdentity;
      }
    }
    return result;
  }, [identities, applications]);

  const getApplicationNames = (applications: Application[]) => {
    const listOfNames = applications.map((app: Application) => app.name);
    return listOfNames.join(", ");
  };

  const initialValues: FormValues = {
    [APPLICATION_NAME]: getApplicationNames(applications) || "",
    [SOURCE_CREDENTIALS]: sourceCredentialsInitialValue,
    [MAVEN_SETTINGS]: mavenSettingsInitialValue,
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: initialValues,
    validationSchema: validationSchema({
      [SOURCE_CREDENTIALS]: true,
      [MAVEN_SETTINGS]: false,
    }),
    onSubmit: onSubmit,
  });

  return (
    <FormikProvider value={formik}>
      <Form>
        {error && (
          <Alert variant="danger" title={getAxiosErrorMessage(error)} />
        )}
        <TextInput
          value={formik.values.applicationName}
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
            options={sourceIdentityOptions}
            toOptionWithValue={toIdentityDropdownOptionWithValue}
          />
        </FormGroup>
        <FormGroup label="Maven settings" fieldId={MAVEN_SETTINGS}>
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
            options={mavenIdentityOptions}
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
