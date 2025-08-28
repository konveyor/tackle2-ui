import React, { useMemo } from "react";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import {
  ActionGroup,
  Button,
  ButtonVariant,
  Form,
  Text,
  Title,
} from "@patternfly/react-core";
import WarningTriangleIcon from "@patternfly/react-icons/dist/esm/icons/warning-triangle-icon";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { Application, Identity, IdentityKind, Ref } from "@app/api/models";
import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { toOptionLike, toRef } from "@app/utils/model-utils";
import {
  UpdateAllApplicationsResult,
  useBulkPatchApplicationsMutation,
} from "@app/queries/applications";
import { useFetchIdentities } from "@app/queries/identities";
import { HookFormPFGroupController } from "@app/components/HookFormPFFields";
import { OptionWithValue, SimpleSelect } from "@app/components/SimpleSelect";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { DecoratedApplication } from "../useDecoratedApplications";

export interface FormValues {
  source: number | null;
  maven: number | null;
  asset: number | null;
}

export interface ApplicationIdentityFormProps {
  applications: DecoratedApplication[];
  onClose: () => void;
}

function identitiesToOptions(
  identities?: Identity[]
): OptionWithValue<number>[] {
  if (!identities) {
    return [];
  }
  return identities.map((identity) => ({
    value: identity.id,
    toString: () => identity.name,
  }));
}

function firstIdentityOfKind(
  application: DecoratedApplication,
  kind: IdentityKind
) {
  return application.direct.identities?.find((i) => i.kind === kind);
}

function hasIdentityOfKind(
  applications: DecoratedApplication | DecoratedApplication[],
  kind: IdentityKind | IdentityKind[]
) {
  const kinds = Array.isArray(kind) ? kind : [kind];
  const apps = Array.isArray(applications) ? applications : [applications];
  return apps.some((app) =>
    app.direct.identities?.some((i) => kinds.includes(i.kind))
  );
}

export const ApplicationIdentityForm: React.FC<
  ApplicationIdentityFormProps
> = ({ applications, onClose }) => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  const { identitiesByKind } = useFetchIdentities();

  const sourceIdentityOptions = identitiesToOptions(identitiesByKind.source);
  const mavenIdentityOptions = identitiesToOptions(identitiesByKind.maven);
  const assetIdentityOptions = identitiesToOptions(identitiesByKind.asset);

  const onUpdateApplicationsSuccess = ({
    success,
    failure,
  }: UpdateAllApplicationsResult) => {
    if (success.length > 0) {
      pushNotification({
        title: t("toastr.success.applicationsUpdated", {
          count: success.length,
          firstName: success[0].application.name,
        }),
        variant: "success",
      });
    }

    if (failure.length > 0) {
      pushNotification({
        title: t("toastr.fail.applicationsUpdated", {
          count: failure.length,
          firstName: failure[0].application.name,
        }),
        variant: "danger",
      });
    }

    if (failure.length === 0) {
      onClose();
    }
  };

  const onUpdateApplicationsError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const { mutate: updateAllApplications } = useBulkPatchApplicationsMutation(
    onUpdateApplicationsSuccess,
    onUpdateApplicationsError
  );

  const onSubmit = ({ source, maven, asset }: FormValues) => {
    const updatedIdentities: Ref[] = [
      toRef(identitiesByKind.source?.find((i) => i.id === source)),
      toRef(identitiesByKind.maven?.find((i) => i.id === maven)),
      toRef(identitiesByKind.asset?.find((i) => i.id === asset)),
    ].filter(Boolean);

    const patch = (application: Application) => {
      return Object.assign({}, application, {
        identities: updatedIdentities,
      });
    };

    updateAllApplications({
      applications: applications.map((a) => a._),
      patch,
    });
  };

  const validationSchema = yup.object({
    source: yup
      .number()
      .nullable()
      .oneOf(
        [...sourceIdentityOptions.map((o) => o.value), null],
        t("validation.notOneOf")
      ),
    maven: yup
      .number()
      .nullable()
      .oneOf(
        [...mavenIdentityOptions.map((o) => o.value), null],
        t("validation.notOneOf")
      ),
    asset: yup
      .number()
      .nullable()
      .oneOf(
        [...assetIdentityOptions.map((o) => o.value), null],
        t("validation.notOneOf")
      ),
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    control,
  } = useForm<FormValues>({
    defaultValues: {
      source: firstIdentityOfKind(applications[0], "source")?.id ?? null,
      maven: firstIdentityOfKind(applications[0], "maven")?.id ?? null,
      asset: firstIdentityOfKind(applications[0], "asset")?.id ?? null,
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const existingIdentitiesError = useMemo(() => {
    return applications.length === 1
      ? false
      : hasIdentityOfKind(applications, ["source", "maven", "asset"]);
  }, [applications]);

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <Title headingLevel="h3">
        {t("dialog.message.updateApplications", {
          count: applications.length,
          names: applications.map((app) => app.name),
        })}
      </Title>

      <HookFormPFGroupController
        control={control}
        name="source"
        label={"Source repository credentials"}
        fieldId="source"
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelect
            maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
            variant="typeahead"
            toggleId="source-credentials-toggle"
            id="source-credentials"
            toggleAriaLabel="Source credentials"
            aria-label={name}
            value={toOptionLike(value, sourceIdentityOptions)}
            options={sourceIdentityOptions}
            onChange={(selection) => {
              const selectionValue =
                selection as (typeof sourceIdentityOptions)[number];
              onChange(selectionValue.value);
            }}
            onClear={() => onChange(null)}
          />
        )}
      />

      <HookFormPFGroupController
        control={control}
        name="maven"
        label={"Maven settings"}
        fieldId="maven"
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelect
            maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
            variant="typeahead"
            toggleId="maven-settings-toggle"
            id="maven-settings"
            toggleAriaLabel="Maven settings"
            aria-label={name}
            value={toOptionLike(value, mavenIdentityOptions)}
            options={mavenIdentityOptions}
            onChange={(selection) => {
              const selectionValue =
                selection as (typeof mavenIdentityOptions)[number];
              onChange(selectionValue.value);
            }}
            onClear={() => onChange(null)}
          />
        )}
      />

      <HookFormPFGroupController
        control={control}
        name="asset"
        label={"Asset repository credentials"}
        fieldId="asset"
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelect
            maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
            variant="typeahead"
            toggleId="asset-toggle"
            id="asset"
            toggleAriaLabel="Asset"
            aria-label={name}
            value={toOptionLike(value, assetIdentityOptions)}
            options={assetIdentityOptions}
            onChange={(selection) => {
              const selectionValue =
                selection as (typeof assetIdentityOptions)[number];
              onChange(selectionValue.value);
            }}
            onClear={() => onChange(null)}
          />
        )}
      />

      {existingIdentitiesError && (
        <Text>
          <WarningTriangleIcon className={spacing.mrSm} color="orange" />
          One or more of the selected applications have already been assigned
          credentials. Any changes made will override the existing values.
        </Text>
      )}

      <ActionGroup>
        <Button
          type="submit"
          id="submit"
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
          onClick={onClose}
        >
          {t("actions.cancel")}
        </Button>
      </ActionGroup>
    </Form>
  );
};
