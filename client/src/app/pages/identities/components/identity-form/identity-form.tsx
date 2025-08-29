import React from "react";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import { AxiosError } from "axios";
import {
  ActionGroup,
  Button,
  ButtonVariant,
  Form,
} from "@patternfly/react-core";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { OptionWithValue, SimpleSelect } from "@app/components/SimpleSelect";
import { Identity, IdentityKind, IdentityKinds, New } from "@app/api/models";
import { duplicateNameCheck, getAxiosErrorMessage } from "@app/utils/utils";
import { toOptionLike } from "@app/utils/model-utils";
import {
  useCreateIdentityMutation,
  useFetchIdentities,
  useUpdateIdentityMutation,
} from "@app/queries/identities";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { NotificationsContext } from "@app/components/NotificationsContext";

import { KIND_OPTIONS } from "../../utils";
import { KindSourceForm } from "./kind-source-form";
import { KindAssetForm } from "./kind-asset-form";
import { KindMavenSettingsFileForm } from "./kind-maven-settings-file-form";
import { KindSimpleUsernamePasswordForm } from "./kind-simple-username-password-form";
import { KindBearerTokenForm } from "./kind-bearer-token-form";

import "./identity-form.css";

export type UserCredentials = "userpass" | "source";

interface IdentityFormValues {
  name: string;
  description: string;
  kind: IdentityKind;
  default: boolean;

  settings: string;
  settingsFilename: string;

  userCredentials?: UserCredentials;
  user: string;
  password: string;
  key: string;
  keyFilename: string;
}

export interface IdentityFormProps {
  identity?: Identity;
  defaultIdentities?: Record<IdentityKind, Identity | undefined>;
  onClose: () => void;
}

export const IdentityForm: React.FC<IdentityFormProps> = ({
  identity,
  defaultIdentities,
  onClose,
}) => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  const getUserCredentialsInitialValue = (
    identity?: Identity
  ): UserCredentials | undefined => {
    if (identity?.kind && ["source", "asset"].includes(identity.kind)) {
      if (identity?.user && identity?.password) {
        return "userpass";
      } else {
        return "source";
      }
    } else {
      return undefined;
    }
  };

  const notifyError = (errorMessage: string) => {
    pushNotification({
      title: errorMessage,
      variant: "danger",
    });
  };

  const { mutate: createIdentity } = useCreateIdentityMutation(
    (identity) => {
      pushNotification({
        title: t("toastr.success.createWhat", {
          what: identity.name,
          type: t("terms.credential"),
        }),
        variant: "success",
      });
      onClose();
    },
    (error) => notifyError(getAxiosErrorMessage(error))
  );

  const { mutate: updateIdentity } = useUpdateIdentityMutation(
    (identity) => {
      pushNotification({
        title: t("toastr.success.saveWhat", {
          what: identity.name,
          type: t("terms.credential"),
        }),
        variant: "success",
      });
      onClose();
    },

    (error) => notifyError(getAxiosErrorMessage(error))
  );
  const { mutateAsync: updateIdentityAsync } = useUpdateIdentityMutation();

  const onSubmit = async ({ kind, ...formValues }: IdentityFormValues) => {
    const payload: New<Identity> = {
      kind: kind,
      default: formValues.default,
      name: formValues.name.trim(),
      description: formValues.description.trim(),

      // always empty the data fields in case the kind changed
      key: "",
      settings: "",
      user: "",
      password: "",
    };

    if (kind === "proxy") {
      Object.assign(payload, {
        user: formValues.user.trim(),
        password: formValues.password.trim(),
      });
    }

    if (kind === "maven") {
      Object.assign(payload, {
        settings: formValues.settings.trim(),
      });
    }

    if (kind === "source" && formValues.userCredentials === "source") {
      Object.assign(payload, {
        key: formValues.key,
        password: formValues.password.trim(),
      });
    }

    if (kind === "source" && formValues.userCredentials === "userpass") {
      Object.assign(payload, {
        user: formValues.user.trim(),
        password: formValues.password.trim(),
      });
    }

    if (kind === "asset" && formValues.userCredentials === "source") {
      Object.assign(payload, {
        key: formValues.key,
        password: formValues.password.trim(),
      });
    }

    if (kind === "asset" && formValues.userCredentials === "userpass") {
      Object.assign(payload, {
        user: formValues.user.trim(),
        password: formValues.password.trim(),
      });
    }

    if (kind === "basic-auth") {
      Object.assign(payload, {
        user: formValues.user.trim(),
        password: formValues.password.trim(),
      });
    }

    if (kind === "bearer") {
      Object.assign(payload, {
        key: formValues.key.trim(),
      });
    }

    try {
      // Unset the existing default if necessary
      const existingDefault = defaultIdentities?.[kind];
      if (
        payload.default &&
        existingDefault &&
        (!identity || existingDefault.id !== identity.id)
      ) {
        await updateIdentityAsync({ ...existingDefault, default: false });
      }

      // Update/Create!
      if (identity) {
        updateIdentity({ id: identity.id, ...payload });
      } else {
        createIdentity(payload);
      }
    } catch (e) {
      notifyError(getAxiosErrorMessage(e as AxiosError));
    }
  };

  const { identities } = useFetchIdentities();

  const validationSchema: yup.SchemaOf<IdentityFormValues> = yup
    .object()
    .shape({
      name: yup
        .string()
        .trim()
        .required(t("validation.required"))
        .min(3, t("validation.minLength", { length: 3 }))
        .max(120, t("validation.maxLength", { length: 120 }))
        .test(
          "Duplicate name",
          "An identity with this name already exists. Use a different name.",
          (value) =>
            duplicateNameCheck(identities, identity || null, value || "")
        ),
      description: yup
        .string()
        .trim()
        .defined()
        .max(250, t("validation.maxLength", { length: 250 })),
      kind: yup
        .mixed<IdentityKind>()
        .oneOf([...IdentityKinds])
        .required(),
      default: yup.bool().defined(),

      userCredentials: yup.mixed<UserCredentials>().when("kind", {
        is: (kind: IdentityKind) => kind === "source" || kind === "asset",
        then: (schema) => schema.required().oneOf(["userpass", "source"]),
      }),

      settings: yup
        .string()
        .defined()
        .when("kind", {
          is: (kind: IdentityKind) => kind === "maven",
          then: (schema) =>
            schema
              .required()
              .validMavenSettingsXml(
                (value?: string) => value === identity?.settings
              ),
        }),
      settingsFilename: yup.string().defined(),

      user: yup
        .string()
        .defined()
        .trim()
        .when(["kind", "userCredentials"], {
          is: (kind: IdentityKind, userCredentials: UserCredentials) =>
            (kind === "source" || kind === "asset") &&
            userCredentials === "userpass",
          then: (schema) =>
            schema
              .required(t("validation.required"))
              .min(3, t("validation.minLength", { length: 3 }))
              .max(120, t("validation.maxLength", { length: 120 })),
        })
        .when("kind", {
          is: (kind: IdentityKind) => kind === "proxy",
          then: (schema) =>
            schema
              .required(t("validation.required"))
              .min(3, t("validation.minLength", { length: 3 }))
              .max(120, t("validation.maxLength", { length: 120 })),
        })
        .when("kind", {
          is: (kind: IdentityKind) => kind === "basic-auth",
          then: (schema) =>
            schema
              .required(t("validation.required"))
              .min(3, t("validation.minLength", { length: 3 }))
              .max(120, t("validation.maxLength", { length: 120 }))
              .email("Username must be a valid email"),
        }),
      password: yup
        .string()
        .defined()
        .trim()
        .when("kind", {
          is: (kind: IdentityKind) => kind === "proxy",
          then: (schema) =>
            schema
              .required(t("validation.required"))
              .min(3, t("validation.minLength", { length: 3 }))
              .max(220, t("validation.maxLength", { length: 220 })),
        })
        .when("kind", {
          is: (kind: IdentityKind) => kind === "basic-auth",
          then: (schema) =>
            schema
              .required(t("validation.required"))
              .min(3, t("validation.minLength", { length: 3 }))
              .max(281, t("validation.maxLength", { length: 281 })),
        })
        .when(["kind", "userCredentials"], {
          is: (kind: IdentityKind, userCredentials: UserCredentials) =>
            (kind === "source" || kind === "asset") &&
            userCredentials === "userpass",
          then: (schema) =>
            schema
              .required(t("validation.required"))
              .min(3, t("validation.minLength", { length: 3 }))
              .max(120, t("validation.maxLength", { length: 120 })),
        }),
      key: yup
        .string()
        .defined()
        .trim()
        .when(["kind", "userCredentials"], {
          is: (kind: IdentityKind, userCredentials: UserCredentials) =>
            (kind === "source" || kind === "asset") &&
            userCredentials === "source",
          // If we want to verify key contents before saving, add the yup test in the then function
          then: (schema) => schema.required(t("validation.required")),
        })
        .when("kind", {
          is: (kind: IdentityKind) => kind === "bearer",
          then: (schema) => schema.required(t("validation.required")),
        }),
      keyFilename: yup.string().defined(),
    });

  const methods = useForm<IdentityFormValues>({
    defaultValues: {
      name: identity?.name || "",
      description: identity?.description || "",
      kind: identity?.kind,
      default: identity?.default ?? false,
      userCredentials: identity?.kind
        ? getUserCredentialsInitialValue({ ...identity })
        : undefined,
      settings: identity?.settings || "",
      settingsFilename: "",
      user: identity?.user || "",
      password: identity?.password || "",
      key: identity?.key || "",
      keyFilename: "",
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });
  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    getValues,
    control,
    resetField,
  } = methods;

  const values = getValues();

  return (
    <FormProvider {...methods}>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <HookFormPFTextInput
          control={control}
          name="name"
          label="Name"
          fieldId="name"
          isRequired
        />
        <HookFormPFTextInput
          control={control}
          name="description"
          label="Description"
          fieldId="description"
        />

        <HookFormPFGroupController
          control={control}
          name="kind"
          label="Type"
          fieldId="type-select"
          isRequired
          renderInput={({ field: { value, name, onChange } }) => (
            <SimpleSelect
              id="type-select"
              toggleId="type-select-toggle"
              toggleAriaLabel="Type select dropdown toggle"
              aria-label={name}
              value={value ? toOptionLike(value, KIND_OPTIONS) : undefined}
              options={KIND_OPTIONS}
              onChange={(selection) => {
                const selectionValue =
                  selection as OptionWithValue<IdentityKind>;
                onChange(selectionValue.value);
                // So we don't retain the values from the wrong type of credential
                resetField("user");
                resetField("password");
              }}
            />
          )}
        />

        {values?.kind === "source" && (
          <KindSourceForm
            identity={identity}
            defaultIdentities={defaultIdentities}
          />
        )}

        {values?.kind === "asset" && <KindAssetForm identity={identity} />}

        {values?.kind === "maven" && (
          <KindMavenSettingsFileForm
            identity={identity}
            defaultIdentities={defaultIdentities}
          />
        )}

        {values?.kind === "proxy" && (
          <KindSimpleUsernamePasswordForm
            identity={identity}
            usernameLabel="Username"
            passwordLabel="Password"
            passwordRequired={false}
          />
        )}

        {values?.kind === "basic-auth" && (
          <KindSimpleUsernamePasswordForm
            identity={identity}
            usernameLabel="Jira username or email"
            passwordLabel="Token"
          />
        )}

        {values?.kind === "bearer" && (
          <KindBearerTokenForm identity={identity} />
        )}

        <ActionGroup>
          <Button
            type="submit"
            aria-label="submit"
            id="submit"
            variant={ButtonVariant.primary}
            isDisabled={!isValid || isSubmitting || isValidating || !isDirty}
          >
            {!identity ? "Create" : "Save"}
          </Button>
          <Button
            type="button"
            id="cancel"
            aria-label="cancel"
            variant={ButtonVariant.link}
            isDisabled={isSubmitting || isValidating}
            onClick={onClose}
          >
            Cancel
          </Button>
        </ActionGroup>
      </Form>
    </FormProvider>
  );
};
