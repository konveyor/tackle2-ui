import React, { useEffect, useMemo, useState } from "react";
import { AxiosError, AxiosPromise, AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";

import {
  ActionGroup,
  Alert,
  Button,
  ButtonVariant,
  Card,
  Form,
  FormGroup,
  TextInput,
  Text,
} from "@patternfly/react-core";
import WarningTriangleIcon from "@patternfly/react-icons/dist/esm/icons/warning-triangle-icon";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { Application, Identity, Ref } from "@app/api/models";
import { SingleSelectFetchOptionValueFormikField } from "@app/shared/components";
import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
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
import {
  useFetchApplications,
  useUpdateAllApplicationsMutation,
  useUpdateApplicationMutation,
} from "@app/queries/applications";
import { useFetchIdentities } from "@app/queries/identities";

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
  const [error, setAxiosError] = useState<AxiosError>();

  const { identities } = useFetchIdentities();

  const { refetch: refetchApplications } = useFetchApplications();

  // Actions
  const onCreateUpdateApplicationSuccess = (response: any) => {
    if (response) {
      onSaved(response);
    }
    formik.setSubmitting(false);
  };

  const onCreateUpdateApplicationError = (error: AxiosError) => {
    setAxiosError(error);
    formik.setSubmitting(false);
  };

  const { mutate: updateAllApplications } = useUpdateAllApplicationsMutation(
    onCreateUpdateApplicationSuccess,
    onCreateUpdateApplicationError
  );

  const onSubmit = (formValues: FormValues) => {
    let updatePromises: Array<AxiosPromise<Application>> = [];
    applications.forEach((application) => {
      let updatedIdentities: Ref[] = [];
      if (application.identities && identities) {
        let newSourceCredentials: Ref | IdentityDropdown;
        const { sourceCredentials } = formValues;
        if (sourceCredentials.id) {
          newSourceCredentials = sourceCredentials;
          updatedIdentities.push(newSourceCredentials as Ref);
        }
        let newMavenSettings;
        const { mavenSettings } = formValues;
        if (mavenSettings.id) {
          newMavenSettings = mavenSettings;
          updatedIdentities.push(newMavenSettings as Ref);
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
          ...application,
          ...payload,
        });
        updatePromises.push(promise);
      }
    });
    updateAllApplications(updatePromises);
  };
  const emptyIdentity: Identity = { id: 0, name: "None", createUser: "" };

  let mavenIdentityOptions: Identity[] =
    identities?.filter((i) => i.kind === "maven") || [];
  mavenIdentityOptions.unshift(emptyIdentity);
  mavenIdentityOptions = mavenIdentityOptions.map((i) => toIdentityDropdown(i));

  let sourceIdentityOptions: Identity[] =
    identities?.filter((i) => i.kind === "source") || [];
  sourceIdentityOptions.unshift(emptyIdentity);
  sourceIdentityOptions = sourceIdentityOptions.map((i) =>
    toIdentityDropdown(i)
  );

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

  useEffect(() => {
    if (identities && applications) {
      const isExistingSourceCreds = applications.some((app) => {
        return getKindIDByRef(identities, app, "source");
      });
      const isExistingMavenCreds = applications.some((app) => {
        return getKindIDByRef(identities, app, "maven");
      });
      setExistingIdentitiesError(isExistingMavenCreds || isExistingSourceCreds);
    }
  }, [identities, formik.values]);
  const [existingIdentitiesError, setExistingIdentitiesError] = useState(false);
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
        <FormGroup label="Source credentials" fieldId={SOURCE_CREDENTIALS}>
          <SingleSelectFetchOptionValueFormikField
            fieldConfig={{ name: SOURCE_CREDENTIALS }}
            selectConfig={{
              variant: "typeahead",
              "aria-label": "source credentials",
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
              "aria-label": "maven settings",
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
        <>
          {existingIdentitiesError && (
            <>
              <Text>
                <WarningTriangleIcon className={spacing.mrSm} color="orange" />
                One or more of the selected applications have already been
                assigned credentials. Any changes made will override the
                existing values.
              </Text>
            </>
          )}
        </>
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
