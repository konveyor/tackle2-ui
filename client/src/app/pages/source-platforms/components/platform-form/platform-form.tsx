import React from "react";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import {
  ActionGroup,
  Button,
  ButtonVariant,
  Form,
} from "@patternfly/react-core";

import type { SourcePlatform, New } from "@app/api/models";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { NotificationsContext } from "@app/components/NotificationsContext";
import {
  useFetchPlatforms,
  useCreatePlatformMutation,
  useUpdatePlatformMutation,
} from "@app/queries/platforms";
import { duplicateNameCheck, getAxiosErrorMessage } from "@app/utils/utils";

import { ConditionalRender } from "@app/components/ConditionalRender";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { SimpleSelect } from "@app/components/SimpleSelect";
import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { useFetchIdentities } from "@app/queries/identities";

export interface PlatformFormValues {
  kind: string;
  name: string;
  url: string;
  credentials?: string;
}

export interface PlatformFormProps {
  platform?: SourcePlatform | null;
  onClose: () => void;
}

/**
 * This component simply wraps `ArchetypeForm` and will render it when the form's data
 * is ready to render.  Since the form's `defaultValues` are built on the first render,
 * if the fetch data is not ready at that moment, the initial values will be wrong.  Very
 * specifically, if the app is loaded on the archetype page, on the first load of the
 * form, that tag data may not yet be loaded.  Without the tag data, the criteria and
 * manual tags can nothing to match to and would incorrectly render no data even if there
 * is data available.
 *
 * TL;DR: Wait for all data to be ready before rendering so existing data is rendered!
 *
 * TODO: The first `!isDataReady` to `isDataReady` transition could be detected and
 *       if the the form is unchanged, new default values could be pushed.
 */
export const PlatformFormDataWaiter: React.FC<PlatformFormProps> = ({
  ...rest
}) => {
  const { isDataReady } = usePlatformFormData();
  return (
    <ConditionalRender when={!isDataReady} then={<AppPlaceholder />}>
      <PlatformForm {...rest} />
    </ConditionalRender>
  );
};

const PlatformForm: React.FC<PlatformFormProps> = ({ platform, onClose }) => {
  const { t } = useTranslation();

  console.log(platform);
  const { existingPlatforms, createPlatform, updatePlatform } =
    usePlatformFormData({
      onActionSuccess: onClose,
    });

  const { identities } = useFetchIdentities();
  const identitiesOptions = identities.map((identity) => identity.name);

  const validationSchema = yup.object().shape({
    kind: yup
      .string()
      .trim()
      .required(t("validation.required"))
      .min(3, t("validation.minLength", { length: 3 }))
      .max(120, t("validation.maxLength", { length: 120 })),

    name: yup
      .string()
      .trim()
      .required(t("validation.required"))
      .min(3, t("validation.minLength", { length: 3 }))
      .max(120, t("validation.maxLength", { length: 120 }))
      .test(
        "Duplicate name",
        "A platform with this name already exists. Use a different name.",
        (value) =>
          existingPlatforms
            ? duplicateNameCheck(
                existingPlatforms,
                platform || null,
                value ?? ""
              )
            : false
      ),

    url: yup
      .string()
      .trim()
      .required(t("validation.required"))
      .url(t("validation.url")),

    Identity: yup
      .string()
      .trim()
      .max(250, t("validation.maxLength", { length: 250 }))
      .nullable(),

    applications: yup
      .array()
      .of(yup.object({ id: yup.number(), name: yup.string() })),
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    control,

    // for debugging
    // getValues,
    // getFieldState,
    // formState,
  } = useForm<PlatformFormValues>({
    defaultValues: !platform
      ? {
          kind: "",
          name: "",
          url: "",
          credentials: "",
        }
      : {
          kind: platform.kind,
          name: platform.name,
          url: platform.url,
          credentials: identities.find(
            (identity) => identity.id === platform.identity?.id
          )?.name,
        },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const getIdentity = (identityName: string | undefined) => {
    const temp = identities.find((identity) => identity.name === identityName);
    return {
      id: temp?.id || 0,
      name: temp?.name || "",
    };
  };

  const onValidSubmit = (values: PlatformFormValues) => {
    const payload: New<SourcePlatform> = {
      name: values.name,
      kind: values.kind,
      url: values.url,
    };
    if (values.credentials) {
      payload.identity = getIdentity(values.credentials);
    }

    if (platform) {
      updatePlatform({
        id: platform.id,
        applications: platform.applications,
        ...payload,
      });
    } else {
      createPlatform(payload);
    }
  };

  return (
    <Form onSubmit={handleSubmit(onValidSubmit)} id="platform-form">
      <HookFormPFTextInput
        control={control}
        name="name"
        label="name"
        fieldId="name"
        isRequired
      />

      <HookFormPFGroupController
        control={control}
        name="kind"
        label={t("terms.providerType")}
        fieldId="kind"
        isRequired
        renderInput={({ field: { value, name, onChange } }) => (
          <>
            <SimpleSelect
              maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
              placeholderText={t("composed.selectOne", {
                what: t("terms.providerType").toLowerCase(),
              })}
              variant="typeahead"
              toggleId="provider-type-toggle"
              id="provider-type-select"
              toggleAriaLabel="Provider type select dropdown toggle"
              aria-label={name}
              value={value}
              options={["aws", "azure", "gcp", "kubernetes", "other"]}
              onChange={(selection) => {
                onChange(selection);
              }}
              onClear={() => onChange("")}
            />
          </>
        )}
      />

      <HookFormPFTextInput
        control={control}
        name="url"
        label="url"
        fieldId="url"
        isRequired
      />

      <HookFormPFGroupController
        control={control}
        name="credentials"
        label="credentials"
        fieldId="credentials"
        renderInput={({ field: { value, name, onChange } }) => (
          <>
            <SimpleSelect
              maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
              placeholderText={t("composed.selectOne", {
                what: t("terms.credentials").toLowerCase(),
              })}
              variant="typeahead"
              toggleId="credentials-toggle"
              id="credentials-select"
              toggleAriaLabel="Credentials select dropdown toggle"
              aria-label={name}
              value={value}
              options={identitiesOptions}
              onChange={(selection) => {
                onChange(selection);
              }}
              onClear={() => onChange("")}
            />
          </>
        )}
      />

      <ActionGroup>
        <Button
          type="submit"
          id="submit"
          aria-label="submit"
          variant={ButtonVariant.primary}
          isDisabled={!isValid || isSubmitting || isValidating || !isDirty}
        >
          {!platform ? t("actions.create") : t("actions.save")}
        </Button>
        <Button
          type="button"
          id="cancel"
          aria-label="cancel"
          variant={ButtonVariant.link}
          isDisabled={isSubmitting || isValidating}
          onClick={onClose}
        >
          {t("actions.cancel")}
        </Button>
      </ActionGroup>
    </Form>
  );
};

const usePlatformFormData = ({
  onActionSuccess = () => {},
  onActionFail = () => {},
}: {
  onActionSuccess?: () => void;
  onActionFail?: () => void;
} = {}) => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  // Fetch data
  const { platforms: existingPlatforms, isSuccess: isPlatformsSuccess } =
    useFetchPlatforms();

  // Mutation notification handlers
  const onCreateSuccess = (platform: SourcePlatform) => {
    pushNotification({
      title: t("toastr.success.createWhat", {
        type: t("terms.platform").toLocaleLowerCase(),
        what: platform.name,
      }),
      variant: "success",
    });
    onActionSuccess();
  };

  const onUpdateSuccess = (_id: number) => {
    pushNotification({
      title: t("toastr.success.save", {
        type: t("terms.platform").toLocaleLowerCase(),
      }),
      variant: "success",
    });
    onActionSuccess();
  };

  const onCreateUpdateError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
    onActionFail();
  };

  const { mutate: createPlatform } = useCreatePlatformMutation(
    onCreateSuccess,
    onCreateUpdateError
  );

  const { mutate: updatePlatform } = useUpdatePlatformMutation(
    onUpdateSuccess,
    onCreateUpdateError
  );

  return {
    existingPlatforms,
    isDataReady: isPlatformsSuccess && existingPlatforms,
    createPlatform,
    updatePlatform,
  };
};
