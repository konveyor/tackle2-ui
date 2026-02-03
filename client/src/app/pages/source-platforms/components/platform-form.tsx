import * as React from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { AxiosError } from "axios";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import {
  ActionGroup,
  Button,
  ButtonVariant,
  Form,
  Popover,
} from "@patternfly/react-core";
import { HelpIcon } from "@patternfly/react-icons/dist/esm/icons/help-icon";

import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import type { New, SourcePlatform } from "@app/api/models";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { OptionWithValue, SimpleSelect } from "@app/components/SimpleSelect";
import { usePlatformKindList } from "@app/hooks/usePlatformKindList";
import { useFetchIdentities } from "@app/queries/identities";
import {
  useCreatePlatformMutation,
  useFetchPlatforms,
  useUpdatePlatformMutation,
} from "@app/queries/platforms";
import { toOptionLike } from "@app/utils/model-utils";
import { duplicateNameCheck, getAxiosErrorMessage } from "@app/utils/utils";

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

// Wait for all data to be ready before rendering so existing data is rendered!
export const PlatformForm: React.FC<PlatformFormProps> = ({ ...rest }) => {
  const { isDataReady } = usePlatformFormData();
  return (
    <ConditionalRender when={!isDataReady} then={<AppPlaceholder />}>
      <PlatformFormRenderer {...rest} />
    </ConditionalRender>
  );
};

const PlatformFormRenderer: React.FC<PlatformFormProps> = ({
  platform,
  onClose,
}) => {
  const { t } = useTranslation();
  const {
    kinds: platformKindList,
    getUrlTooltip,
    getCredentialTooltip,
  } = usePlatformKindList();

  const { existingPlatforms, createPlatform, updatePlatform } =
    usePlatformFormData({
      onActionSuccess: onClose,
    });

  const { identities } = useFetchIdentities();
  const identitiesOptions = identities
    .filter(({ kind }) => kind === "source")
    .map((identity) => identity.name);

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
        t("validation.duplicateName", { type: "platform" }),
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

    credentials: yup
      .string()
      .trim()
      .max(250, t("validation.maxLength", { length: 250 }))
      .nullable(),
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    control,
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

  const selectedKind = useWatch({ name: "kind", control });

  const getIdentity = (identityName: string | undefined) => {
    const temp = identities.find((identity) => identity.name === identityName);
    return temp ? { id: temp.id, name: temp.name } : undefined;
  };

  const onValidSubmit = (values: PlatformFormValues) => {
    const payload: New<SourcePlatform> = {
      name: values.name,
      kind: values.kind,
      url: values.url,
    };
    const identity = getIdentity(values.credentials);
    if (identity) {
      payload.identity = identity;
    }

    if (platform) {
      updatePlatform({
        id: platform.id,
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
        label={t("terms.name")}
        fieldId="name"
        isRequired
      />

      <HookFormPFGroupController
        control={control}
        name="kind"
        label={t("terms.platformKind")}
        fieldId="kind"
        isRequired
        renderInput={({ field: { value, name, onChange } }) => (
          <>
            <SimpleSelect
              maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
              placeholderText={t("composed.selectOne", {
                what: t("terms.platformKind").toLowerCase(),
              })}
              variant="typeahead"
              toggleId="platform-kind-toggle"
              id="platform-kind-select"
              toggleAriaLabel="Platform kind select dropdown toggle"
              aria-label={name}
              value={value ? toOptionLike(value, platformKindList) : undefined}
              options={platformKindList || []}
              onChange={(selection) => {
                const selectionValue = selection as OptionWithValue<string>;
                onChange(selectionValue.value);
              }}
              onClear={() => onChange("")}
            />
          </>
        )}
      />

      <HookFormPFTextInput
        control={control}
        name="url"
        label={t("terms.url")}
        fieldId="url"
        isRequired
        labelIcon={
          getUrlTooltip(selectedKind) ? (
            <Popover bodyContent={<div>{getUrlTooltip(selectedKind)}</div>}>
              <button
                type="button"
                aria-label="More info for URL field"
                onClick={(e) => e.preventDefault()}
                className="pf-v5-c-button pf-m-plain"
              >
                <HelpIcon />
              </button>
            </Popover>
          ) : undefined
        }
      />

      <HookFormPFGroupController
        control={control}
        name="credentials"
        label={t("terms.credentials")}
        fieldId="credentials"
        labelIcon={
          getCredentialTooltip(selectedKind) ? (
            <Popover
              bodyContent={<div>{getCredentialTooltip(selectedKind)}</div>}
            >
              <button
                type="button"
                aria-label="More info for credential field"
                onClick={(e) => e.preventDefault()}
                className="pf-v5-c-button pf-m-plain"
              >
                <HelpIcon />
              </button>
            </Popover>
          ) : undefined
        }
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
        type: t("terms.sourcePlatform"),
        what: platform.name,
      }),
      variant: "success",
    });
    onActionSuccess();
  };

  const onUpdateSuccess = (platform: SourcePlatform) => {
    pushNotification({
      title: t("toastr.success.saveWhat", {
        type: t("terms.sourcePlatform"),
        what: platform.name,
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
