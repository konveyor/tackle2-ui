import React, { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import * as yup from "yup";
import { AxiosError } from "axios";
import {
  ActionGroup,
  Alert,
  Button,
  ButtonVariant,
  FileUpload,
  Form,
  Switch,
} from "@patternfly/react-core";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
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
import KeyDisplayToggle from "@app/components/KeyDisplayToggle";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { KIND_OPTIONS } from "../../utils";

import "./identity-form.css";

type UserCredentials = "userpass" | "source";

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
    if (identity?.kind === "source" && identity?.user && identity?.password) {
      return "userpass";
    } else if (identity?.kind === "source") {
      return "source";
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
        is: (kind: string) => ["source", "asset"].includes(kind),
        then: (schema) => schema.required().oneOf(["userpass", "source"]),
      }),

      settings: yup
        .string()
        .defined()
        .when("kind", {
          is: "maven",
          then: yup
            .string()
            .required()
            .validMavenSettingsXml((value) => value === identity?.settings),
        }),
      settingsFilename: yup.string().defined(),

      user: yup
        .string()
        .defined()
        .trim()
        .when(["kind", "userCredentials"], {
          is: (kind: string, userCredentials: string) =>
            (["source", "asset"].includes(kind) &&
              userCredentials === "userpass") ||
            kind === "proxy",
          then: (schema) =>
            schema
              .required(t("validation.required"))
              .min(3, t("validation.minLength", { length: 3 }))
              .max(120, t("validation.maxLength", { length: 120 })),
        })
        .when("kind", {
          is: (value: string) => value === "jira",
          then: (schema) =>
            schema
              .required(t("validation.required"))
              .min(3, t("validation.minLength", { length: 3 }))
              .max(120, t("validation.maxLength", { length: 120 }))
              .email("Username must be a valid email"),
          otherwise: (schema) => schema.trim(),
        }),
      password: yup
        .string()
        .defined()
        .trim()
        .when("kind", {
          is: (value: string) => value === "proxy",
          then: (schema) =>
            schema
              .required(t("validation.required"))
              .min(3, t("validation.minLength", { length: 3 }))
              .max(220, t("validation.maxLength", { length: 220 })),
        })
        .when("kind", {
          is: (value: string) => value === "basic-auth",
          then: (schema) =>
            schema
              .required(t("validation.required"))
              .min(3, t("validation.minLength", { length: 3 }))
              .max(281, t("validation.maxLength", { length: 281 })),
        })
        .when(["kind", "userCredentials"], {
          is: (kind: string, userCredentials: string) =>
            ["source", "asset"].includes(kind) &&
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
        .when(["kind", "userCredentials"], {
          is: (kind: string, userCredentials: string) =>
            ["source", "asset"].includes(kind) && userCredentials === "source",
          // If we want to verify key contents before saving, add the yup test here
          then: (schema) => schema.required(t("validation.required")),
          otherwise: (schema) => schema.trim(),
        })
        .when("kind", {
          is: (kind: string) => kind === "bearer",
          then: (schema) => schema.required(t("validation.required")),
          otherwise: (schema) => schema.trim(),
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

const USER_CREDENTIALS_OPTIONS: OptionWithValue<UserCredentials>[] = [
  {
    value: "userpass",
    toString: () => `Username/Password`,
  },
  {
    value: "source",
    toString: () => `Source Private Key/Passphrase`,
  },
];

const KindSourceForm: React.FC<{
  identity?: Identity;
  defaultIdentities?: Record<IdentityKind, Identity | undefined>;
}> = ({ identity, defaultIdentities }) => {
  const { t } = useTranslation();
  const { control, getValues, setValue, resetField } = useFormContext();
  const values = getValues();

  const [isKeyFileRejected, setIsKeyFileRejected] = useState(false);

  const [isPasswordHidden, setIsPasswordHidden] = useState(true);
  const toggleHidePassword = (e: React.FormEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPasswordHidden(!isPasswordHidden);
  };

  const isPasswordEncrypted = identity?.password === values.password;
  const isKeyEncrypted = identity?.key === values.key;
  const kindDefault = defaultIdentities?.[values.kind as IdentityKind];
  const isReplacingDefault =
    values.default &&
    kindDefault &&
    (!identity || kindDefault.id !== identity.id);

  return (
    <>
      <HookFormPFGroupController
        control={control}
        name="userCredentials"
        label="User credentials"
        isRequired
        fieldId="user-credentials-select"
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelect
            id="user-credentials-select"
            toggleId="user-credentials-select-toggle"
            toggleAriaLabel="User credentials select dropdown toggle"
            aria-label={name}
            value={
              value ? toOptionLike(value, USER_CREDENTIALS_OPTIONS) : undefined
            }
            options={USER_CREDENTIALS_OPTIONS}
            onChange={(selection) => {
              const selectionValue =
                selection as OptionWithValue<UserCredentials>;
              onChange(selectionValue.value);
              // So we don't retain the values from the wrong type of credential
              resetField("default");
              resetField("user");
              resetField("key");
              resetField("password");
            }}
          />
        )}
      />
      <HookFormPFGroupController
        control={control}
        name="default"
        fieldId="default"
        label="Default credential?"
        renderInput={({ field: { onChange, value, name, ref } }) => (
          <>
            <Switch
              id="default"
              name={name}
              label={t("credentials.default.sourceSwitchLabel")}
              isChecked={value}
              onChange={(_, checked) => onChange(checked)}
              ref={ref}
            />
            {isReplacingDefault && (
              <Alert
                isInline
                className="alert-replacing-default"
                variant="warning"
                title={t("credentials.default.changeTitle")}
              >
                <Trans
                  i18nKey="credentials.default.sourceChangeWarning"
                  values={{
                    name: kindDefault.name,
                  }}
                />
              </Alert>
            )}
          </>
        )}
      />

      {values?.userCredentials === "userpass" && (
        <KindSimpleUsernamePasswordForm
          identity={identity}
          usernameLabel="Username"
          passwordLabel="Password"
        />
      )}

      {values?.userCredentials === "source" && (
        <>
          <HookFormPFGroupController
            control={control}
            name="key"
            fieldId="key"
            label="Upload your [SCM Private Key] file or paste its contents below."
            isRequired
            renderInput={({ field: { onChange, value, name } }) => (
              <FileUpload
                data-testid="source-key-upload"
                id="key"
                name={name}
                type="text"
                value={isKeyEncrypted ? "[Encrypted]" : (value ?? "")}
                filename={values.keyFilename}
                filenamePlaceholder="Drag and drop a file or upload one"
                dropzoneProps={{
                  onDropRejected: () => setIsKeyFileRejected(true),
                }}
                validated={isKeyFileRejected ? "error" : "default"}
                onFileInputChange={(_, file) => {
                  setValue("keyFilename", file.name);
                  setIsKeyFileRejected(false);
                }}
                onDataChange={(_, value: string) => {
                  onChange(value);
                }}
                onTextChange={(_, value: string) => {
                  onChange(value);
                }}
                onClearClick={() => {
                  onChange("");
                  setValue("keyFilename", "");
                  setIsKeyFileRejected(false);
                }}
                allowEditingUploadedText
                browseButtonText="Upload"
              />
            )}
          />
          <HookFormPFTextInput
            control={control}
            name="password"
            fieldId="password"
            label="Private Key Passphrase"
            type={isPasswordHidden ? "password" : "text"}
            formGroupProps={{
              labelIcon: !isPasswordEncrypted ? (
                <KeyDisplayToggle
                  keyName="password"
                  isKeyHidden={isPasswordHidden}
                  onClick={toggleHidePassword}
                />
              ) : undefined,
            }}
            onFocus={() => resetField("password")}
          />
        </>
      )}
    </>
  );
};

const KindAssetForm: React.FC<{
  identity?: Identity;
}> = ({ identity }) => {
  const { control, getValues, setValue, resetField } = useFormContext();
  const values = getValues();

  const [isKeyFileRejected, setIsKeyFileRejected] = useState(false);

  const [isPasswordHidden, setIsPasswordHidden] = useState(true);
  const toggleHidePassword = (e: React.FormEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPasswordHidden(!isPasswordHidden);
  };

  const isPasswordEncrypted = identity?.password === values.password;
  const isKeyEncrypted = identity?.key === values.key;

  return (
    <>
      <HookFormPFGroupController
        control={control}
        name="userCredentials"
        label="User credentials"
        isRequired
        fieldId="user-credentials-select"
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelect
            id="user-credentials-select"
            toggleId="user-credentials-select-toggle"
            toggleAriaLabel="User credentials select dropdown toggle"
            aria-label={name}
            value={
              value ? toOptionLike(value, USER_CREDENTIALS_OPTIONS) : undefined
            }
            options={USER_CREDENTIALS_OPTIONS}
            onChange={(selection) => {
              const selectionValue =
                selection as OptionWithValue<UserCredentials>;
              onChange(selectionValue.value);
              // So we don't retain the values from the wrong type of credential
              resetField("default");
              resetField("user");
              resetField("key");
              resetField("password");
            }}
          />
        )}
      />

      {values?.userCredentials === "userpass" && (
        <KindSimpleUsernamePasswordForm
          identity={identity}
          usernameLabel="Username"
          passwordLabel="Password"
        />
      )}

      {values?.userCredentials === "source" && (
        <>
          <HookFormPFGroupController
            control={control}
            name="key"
            fieldId="key"
            label="Upload your [SCM Private Key] file or paste its contents below."
            isRequired
            renderInput={({ field: { onChange, value, name } }) => (
              <FileUpload
                data-testid="source-key-upload"
                id="key"
                name={name}
                type="text"
                value={isKeyEncrypted ? "[Encrypted]" : (value ?? "")}
                filename={values.keyFilename}
                filenamePlaceholder="Drag and drop a file or upload one"
                dropzoneProps={{
                  onDropRejected: () => setIsKeyFileRejected(true),
                }}
                validated={isKeyFileRejected ? "error" : "default"}
                onFileInputChange={(_, file) => {
                  setValue("keyFilename", file.name);
                  setIsKeyFileRejected(false);
                }}
                onDataChange={(_, value: string) => {
                  onChange(value);
                }}
                onTextChange={(_, value: string) => {
                  onChange(value);
                }}
                onClearClick={() => {
                  onChange("");
                  setValue("keyFilename", "");
                  setIsKeyFileRejected(false);
                }}
                allowEditingUploadedText
                browseButtonText="Upload"
              />
            )}
          />
          <HookFormPFTextInput
            control={control}
            name="password"
            fieldId="password"
            label="Private Key Passphrase"
            type={isPasswordHidden ? "password" : "text"}
            formGroupProps={{
              labelIcon: !isPasswordEncrypted ? (
                <KeyDisplayToggle
                  keyName="password"
                  isKeyHidden={isPasswordHidden}
                  onClick={toggleHidePassword}
                />
              ) : undefined,
            }}
            onFocus={() => resetField("password")}
          />
        </>
      )}
    </>
  );
};

const KindMavenSettingsFileForm: React.FC<{
  identity?: Identity;
  defaultIdentities?: Record<IdentityKind, Identity | undefined>;
}> = ({ identity, defaultIdentities }) => {
  const { t } = useTranslation();
  const { control, getValues, setValue } = useFormContext();
  const values = getValues();

  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsFileRejected, setIsSettingsFileRejected] = useState(false);

  const isSettingsEncrypted = identity?.settings === values.settings;
  const kindDefault = defaultIdentities?.[values.kind as IdentityKind];
  const isReplacingDefault =
    values.default &&
    kindDefault &&
    (!identity || kindDefault.id !== identity.id);

  return (
    <>
      <HookFormPFGroupController
        control={control}
        name="default"
        fieldId="default"
        label="Default credential?"
        renderInput={({ field: { onChange, value, name, ref } }) => (
          <>
            <Switch
              id="default"
              name={name}
              label={t("credentials.default.sourceSwitchLabel")}
              isChecked={value}
              onChange={(_, checked) => onChange(checked)}
              ref={ref}
            />
            {isReplacingDefault && (
              <Alert
                isInline
                className="alert-replacing-default"
                variant="warning"
                title={t("credentials.default.changeTitle")}
              >
                <Trans
                  i18nKey="credentials.default.mavenChangeWarning"
                  values={{
                    name: kindDefault.name,
                  }}
                />
              </Alert>
            )}
          </>
        )}
      />
      <HookFormPFGroupController
        control={control}
        name="settings"
        fieldId="settings"
        label="Upload your Settings file or paste its contents below."
        isRequired={values.kind === "maven"}
        errorsSuppressed={isLoading}
        renderInput={({ field: { onChange, value, name } }) => (
          <FileUpload
            data-testid="maven-settings-upload"
            id="settings"
            name={name}
            type="text"
            value={isSettingsEncrypted ? "[Encrypted]" : (value ?? "")}
            filename={values.settingsFilename}
            filenamePlaceholder="Drag and drop a file or upload one"
            dropzoneProps={{
              accept: { "text/xml": [".xml"] },
              onDropRejected: () => setIsSettingsFileRejected(true),
            }}
            validated={isSettingsFileRejected ? "error" : "default"}
            onFileInputChange={(_, file) => {
              setValue("settingsFilename", file.name);
              setIsSettingsFileRejected(false);
            }}
            onDataChange={(_, value: string) => {
              onChange(value);
            }}
            onTextChange={(_, value: string) => {
              onChange(value);
            }}
            onClearClick={() => {
              onChange("");
              setValue("settingsFilename", "");
              setIsSettingsFileRejected(false);
            }}
            onReadStarted={() => setIsLoading(true)}
            onReadFinished={() => setIsLoading(false)}
            isLoading={isLoading}
            allowEditingUploadedText
            browseButtonText="Upload"
          />
        )}
      />
    </>
  );
};

const KindSimpleUsernamePasswordForm: React.FC<{
  identity?: Identity;
  usernameLabel: string;
  passwordLabel: string;
  passwordRequired?: boolean;
}> = ({
  identity,
  usernameLabel = "Username",
  passwordLabel = "Password",
  passwordRequired = true,
}) => {
  const { control, getValues, resetField } = useFormContext();
  const values = getValues();

  const [isPasswordHidden, setIsPasswordHidden] = useState(true);
  const toggleHidePassword = (e: React.FormEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPasswordHidden(!isPasswordHidden);
  };

  const isPasswordEncrypted = identity?.password === values.password;

  return (
    <>
      <HookFormPFTextInput
        control={control}
        name="user"
        label={usernameLabel}
        fieldId="user"
        isRequired
      />
      <HookFormPFTextInput
        control={control}
        name="password"
        label={passwordLabel}
        fieldId="password"
        isRequired={passwordRequired}
        type={isPasswordHidden ? "password" : "text"}
        formGroupProps={{
          labelIcon: !isPasswordEncrypted ? (
            <KeyDisplayToggle
              keyName="password"
              isKeyHidden={isPasswordHidden}
              onClick={toggleHidePassword}
            />
          ) : undefined,
        }}
        onFocus={() => resetField("password")}
      />
    </>
  );
};

const KindBearerTokenForm: React.FC<{ identity?: Identity }> = ({
  identity,
}) => {
  const { control, getValues, resetField } = useFormContext();
  const values = getValues();

  const [isKeyHidden, setIsKeyHidden] = useState(true);
  const toggleHideKey = (e: React.FormEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsKeyHidden(!isKeyHidden);
  };

  const isKeyEncrypted = identity?.key === values.key;

  return (
    <HookFormPFTextInput
      control={control}
      name="key"
      label={"Token"}
      fieldId="key"
      isRequired={true}
      type={isKeyHidden ? "password" : "text"}
      formGroupProps={{
        labelIcon: !isKeyEncrypted ? (
          <KeyDisplayToggle
            keyName="key"
            isKeyHidden={isKeyHidden}
            onClick={toggleHideKey}
          />
        ) : undefined,
      }}
      onFocus={() => resetField("key")}
    />
  );
};
