import React, { useEffect, useState } from "react";
import { AxiosError, AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";

import {
  ActionGroup,
  Alert,
  Button,
  ButtonVariant,
  Form,
  Text,
} from "@patternfly/react-core";
import WarningTriangleIcon from "@patternfly/react-icons/dist/esm/icons/warning-triangle-icon";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { Application, Identity, Ref } from "@app/api/models";
import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { getKindIDByRef, toOptionLike } from "@app/utils/model-utils";
import {
  APPLICATION_NAME,
  MAVEN_SETTINGS,
  SOURCE_CREDENTIALS,
} from "./field-names";
import validationSchema from "./validation-schema";
import { updateApplication } from "@app/api/rest";
import { useUpdateAllApplicationsMutation } from "@app/queries/applications";
import { useFetchIdentities } from "@app/queries/identities";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/shared/components/hook-form-pf-fields";
import { OptionWithValue, SimpleSelect } from "@app/shared/components";

export interface FormValues {
  applicationName: string;
  sourceCredentials: string;
  mavenSettings: string;
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

  const sourceIdentityOptions = identities
    .filter((identity) => identity.kind === "source")
    .map((sourceIdentity) => {
      return {
        value: sourceIdentity.name,
        toString: () => sourceIdentity.name,
      };
    });
  const mavenIdentityOptions = identities
    .filter((identity) => identity.kind === "maven")
    .map((maven) => {
      return {
        value: maven.name,
        toString: () => maven.name,
      };
    });

  // Actions
  const onCreateUpdateApplicationSuccess = (response: any) => {
    if (response) {
      onSaved(response);
    }
  };

  const onCreateUpdateApplicationError = (error: AxiosError) => {
    setAxiosError(error);
  };

  const { mutate: updateAllApplications } = useUpdateAllApplicationsMutation(
    onCreateUpdateApplicationSuccess,
    onCreateUpdateApplicationError
  );

  const onSubmit = (formValues: FormValues) => {
    let updatePromises: Array<Promise<Application>> = [];
    applications.forEach((application) => {
      let updatedIdentities: Ref[] = [];
      if (application.identities && identities) {
        const matchingSourceCredential = identities.find(
          (identity) => identity.name === formValues.sourceCredentials
        );
        if (matchingSourceCredential) {
          updatedIdentities.push({
            name: matchingSourceCredential?.name || "",
            id: matchingSourceCredential.id,
          });
        }
        const matchingMavenSettings = identities.find(
          (identity) => identity.name === formValues.mavenSettings
        );
        if (matchingMavenSettings) {
          updatedIdentities.push({
            name: matchingMavenSettings?.name || "",
            id: matchingMavenSettings.id,
          });
        }
      }
      if (application) {
        const payload: Application = {
          name: application.name,
          identities: updatedIdentities,
          id: application.id,
          businessService: application.businessService,
        };
        let promise: Promise<Application>;
        promise = updateApplication({
          ...application,
          ...payload,
        });
        updatePromises.push(promise);
      }
    });
    updateAllApplications(updatePromises);
  };

  const getApplicationNames = (applications: Application[]) => {
    const listOfNames = applications.map((app: Application) => app.name);
    return listOfNames.join(", ");
  };

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    getValues,
    control,
  } = useForm<FormValues>({
    defaultValues: {
      [APPLICATION_NAME]: getApplicationNames(applications) || "",
      [SOURCE_CREDENTIALS]: getKindIDByRef(
        identities,
        applications[0],
        "source"
      )?.name,
      [MAVEN_SETTINGS]: getKindIDByRef(identities, applications[0], "maven")
        ?.name,
    },
    resolver: yupResolver(
      validationSchema({ [SOURCE_CREDENTIALS]: false, [MAVEN_SETTINGS]: false })
    ),
    mode: "onChange",
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
  }, [identities, getValues()]);
  const [existingIdentitiesError, setExistingIdentitiesError] = useState(false);

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      {error && <Alert variant="danger" title={getAxiosErrorMessage(error)} />}
      <HookFormPFTextInput
        control={control}
        name="applicationName"
        fieldId="application-name"
        aria-label="Manage credentials selected applications"
        isReadOnly
      />
      <HookFormPFGroupController
        control={control}
        name="sourceCredentials"
        label={"Source credentials"}
        fieldId={SOURCE_CREDENTIALS}
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelect
            maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
            variant="typeahead"
            toggleId="source-credentials-toggle"
            id="source-credentials"
            toggleAriaLabel="Source credentials"
            aria-label={name}
            value={
              value ? toOptionLike(value, sourceIdentityOptions) : undefined
            }
            options={sourceIdentityOptions}
            onChange={(selection) => {
              const selectionValue = selection as OptionWithValue<string>;
              onChange(selectionValue.value);
            }}
            onClear={() => onChange("")}
          />
        )}
      />
      <HookFormPFGroupController
        control={control}
        name="mavenSettings"
        label={"Maven settings"}
        fieldId={MAVEN_SETTINGS}
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelect
            maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
            variant="typeahead"
            toggleId="maven-settings-toggle"
            id="maven-settings"
            toggleAriaLabel="Maven settings"
            aria-label={name}
            value={
              value ? toOptionLike(value, mavenIdentityOptions) : undefined
            }
            options={mavenIdentityOptions}
            onChange={(selection) => {
              const selectionValue = selection as OptionWithValue<string>;
              onChange(selectionValue.value);
            }}
            onClear={() => onChange("")}
          />
        )}
      />
      <>
        {existingIdentitiesError && (
          <>
            <Text>
              <WarningTriangleIcon className={spacing.mrSm} color="orange" />
              One or more of the selected applications have already been
              assigned credentials. Any changes made will override the existing
              values.
            </Text>
          </>
        )}
      </>
      <ActionGroup>
        <Button
          type="submit"
          id="identity-form-submit"
          aria-label="submit"
          variant={ButtonVariant.primary}
          isDisabled={!isValid || isSubmitting || isValidating || !isDirty}
        >
          {t("actions.save")}
        </Button>
        <Button
          id="cancel"
          type="button"
          aria-label="cancel"
          variant={ButtonVariant.link}
          onClick={onCancel}
        >
          {t("actions.cancel")}
        </Button>
      </ActionGroup>
    </Form>
  );
};
