import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError, AxiosResponse } from "axios";
import * as yup from "yup";
import {
  ActionGroup,
  Alert,
  Button,
  ButtonVariant,
  FileUpload,
  Form,
} from "@patternfly/react-core";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { OptionWithValue, SimpleSelect } from "@app/shared/components";
import { Identity, IdentityKind } from "@app/api/models";
import { duplicateNameCheck, getAxiosErrorMessage } from "@app/utils/utils";
import schema0 from "./schema-1.0.0.xsd";
import schema1 from "./schema-1.1.0.xsd";
import schema2 from "./schema-1.2.0.xsd";
import { toOptionLike } from "@app/utils/model-utils";

import "./identity-form.css";
import {
  useCreateIdentityMutation,
  useFetchIdentities,
  useUpdateIdentityMutation,
} from "@app/queries/identities";
import KeyDisplayToggle from "@app/common/KeyDisplayToggle";

import { XMLValidator } from "fast-xml-parser";
import { XMLLintValidationResult } from "./validateXML";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/shared/components/hook-form-pf-fields";

type UserCredentials = "userpass" | "source";

interface IdentityFormValues {
  id: number;
  name: string;
  description: string;
  kind?: IdentityKind;
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
  onSaved: (response: AxiosResponse<Identity>) => void;
  onCancel: () => void;
  xmlValidator?: (
    value: string,
    currentSchema: string
  ) => XMLLintValidationResult;
}

export const IdentityForm: React.FC<IdentityFormProps> = ({
  identity: initialIdentity,
  onSaved,
  onCancel,
  xmlValidator,
}) => {
  const { t } = useTranslation();

  const [axiosError, setAxiosError] = useState<AxiosError>();
  const [isLoading, setIsLoading] = useState(false);
  const [identity, setIdentity] = useState(initialIdentity);
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);
  const toggleHidePassword = (e: React.FormEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPasswordHidden(!isPasswordHidden);
  };

  useEffect(() => {
    setIdentity(initialIdentity);
    return () => {
      setIdentity(undefined);
    };
  }, []);

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
  const onCreateUpdateIdentitySuccess = (response: AxiosResponse<Identity>) => {
    onSaved(response);
  };

  const onCreateUpdateIdentityError = (error: AxiosError) => {
    setAxiosError(error);
  };

  const { mutate: createIdentity } = useCreateIdentityMutation(
    onCreateUpdateIdentitySuccess,
    onCreateUpdateIdentityError
  );

  const { mutate: updateIdentity } = useUpdateIdentityMutation(
    onCreateUpdateIdentitySuccess,
    onCreateUpdateIdentityError
  );

  const onSubmit = (formValues: IdentityFormValues) => {
    const payload: Identity = {
      name: formValues.name.trim(),
      description: formValues.description.trim(),
      id: formValues.id,
      kind: formValues.kind,
      //proxy cred
      ...(formValues.kind === "proxy" && {
        password: formValues.password.trim(),
        user: formValues.user.trim(),
        key: "",
        settings: "",
      }),
      // mvn cred
      ...(formValues.kind === "maven" && {
        settings: formValues.settings.trim(),
        key: "",
        password: "",
        user: "",
      }),
      //source credentials with key
      ...(formValues.kind === "source" &&
        formValues.userCredentials === "source" && {
          key: formValues.key,
          password: formValues.password.trim(),
          settings: "",
          user: "",
        }),
      //source credentials with unamepass
      ...(formValues.kind === "source" &&
        formValues.userCredentials === "userpass" && {
          password: formValues.password.trim(),
          user: formValues.user.trim(),
          key: "",
          settings: "",
        }),
    };

    if (identity) {
      updateIdentity({
        ...payload,
      });
    } else {
      createIdentity(payload);
    }
  };

  const { identities } = useFetchIdentities();

  const validationSchema: yup.SchemaOf<IdentityFormValues> = yup
    .object()
    .shape({
      id: yup.number().defined(),
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
        .defined()
        .trim()
        .max(250, t("validation.maxLength", { length: 250 })),
      kind: yup.mixed<IdentityKind>().required(),
      settings: yup
        .string()
        .defined()
        .when("kind", {
          is: "maven",
          then: yup
            .string()
            .required()
            .test({
              name: "xml-validation",
              test: function (value) {
                // If the field is unchanged, it must be valid (it's encrypted, so we can't parse it as XML)
                if (value === identity?.settings) return true;

                if (value) {
                  const validationObject = XMLValidator.validate(value, {
                    allowBooleanAttributes: true,
                  });

                  //if xml is valid, check against schema
                  if (validationObject === true) {
                    let currentSchemaName = "";
                    let currentSchema = "";
                    const supportedSchemaNames = ["1.2.0", "1.1.0", "1.0.0"];
                    if (window.DOMParser) {
                      const parser = new DOMParser();
                      const xmlDoc = parser.parseFromString(value, "text/xml");
                      const settingsElement =
                        xmlDoc.getElementsByTagName("settings")[0]?.innerHTML ||
                        "";

                      supportedSchemaNames.forEach((schemaName) => {
                        if (settingsElement.includes(schemaName)) {
                          currentSchemaName = schemaName;
                        }
                      });
                      switch (currentSchemaName) {
                        case "1.0.0":
                          currentSchema = schema0;
                          break;
                        case "1.1.0":
                          currentSchema = schema1;
                          break;
                        case "1.2.0":
                          currentSchema = schema2;
                          break;
                        default:
                          break;
                      }
                    }
                    const validationResult =
                      xmlValidator && xmlValidator(value, currentSchema);

                    if (!validationResult?.errors) {
                      //valid against  schema
                      return true;
                    } else {
                      //not valid against  schema
                      return this.createError({
                        message: validationResult?.errors?.toString(),
                        path: "settings",
                      });
                    }
                  } else {
                    return this.createError({
                      message: validationObject?.err?.msg?.toString(),
                      path: "settings",
                    });
                  }
                } else {
                  return false;
                }
              },
            }),
        }),
      settingsFilename: yup.string().defined(),
      userCredentials: yup.mixed<UserCredentials>().when("kind", {
        is: "source",
        then: yup.mixed<UserCredentials>().required(),
      }),
      user: yup
        .string()
        .defined()
        .when("kind", {
          is: "proxy",
          then: yup
            .string()
            .required("This value is required")
            .min(3, t("validation.minLength", { length: 3 }))
            .max(120, t("validation.maxLength", { length: 120 })),

          otherwise: (schema) => schema.trim(),
        })
        .when(["kind", "userCredentials"], {
          is: (kind: string, userCredentials: string) =>
            kind === "source" && userCredentials === "userpass",
          then: (schema) =>
            schema
              .required("This field is required.")
              .min(3, t("validation.minLength", { length: 3 }))
              .max(120, t("validation.maxLength", { length: 120 })),
        }),
      password: yup
        .string()
        .defined()
        .when("kind", {
          is: "proxy",
          then: yup
            .string()
            .required("This value is required")
            .min(3, t("validation.minLength", { length: 3 }))
            .max(120, t("validation.maxLength", { length: 120 })),
          otherwise: (schema) => schema.trim(),
        })
        .when(["kind", "userCredentials"], {
          is: (kind: string, userCredentials: string) =>
            kind === "source" && userCredentials === "userpass",
          then: (schema) =>
            schema
              .required("This field is required.")
              .min(3, t("validation.minLength", { length: 3 }))
              .max(120, t("validation.maxLength", { length: 120 })),
        }),
      key: yup
        .string()
        .defined()
        .when(["kind", "userCredentials"], {
          is: (kind: string, userCredentials: string) =>
            kind === "source" && userCredentials === "source",
          then: (schema) => schema.required("This field is required."),
          otherwise: (schema) => schema.trim(),
        }),
      keyFilename: yup.string().defined(),
    });

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    getValues,
    setValue,
    control,
    watch,
  } = useForm<IdentityFormValues>({
    defaultValues: {
      description: identity?.description || "",
      id: identity?.id || 0,
      key: identity?.key || "",
      keyFilename: "",
      kind: identity?.kind,
      userCredentials: identity?.kind
        ? getUserCredentialsInitialValue({ ...identity })
        : undefined,
      name: identity?.name || "",
      password: identity?.password || "",
      settings: identity?.settings || "",
      settingsFilename: "",
      user: identity?.user || "",
    },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  const values = getValues();

  const [isKeyFileRejected, setIsKeyFileRejected] = useState(false);
  const [isSettingsFileRejected, setIsSettingsFileRejected] = useState(false);

  const watchAllFields = watch();

  const userCredentialsOptions: OptionWithValue<UserCredentials>[] = [
    {
      value: "userpass",
      toString: () => `Username/Password`,
    },
    {
      value: "source",
      toString: () => `Source Private Key/Passphrase`,
    },
  ];

  const kindOptions: OptionWithValue<IdentityKind>[] = [
    {
      value: "source",
      toString: () => `Source Control`,
    },
    {
      value: "maven",
      toString: () => `Maven Settings File`,
    },
    {
      value: "proxy",
      toString: () => `Proxy`,
    },
  ];

  const isPasswordEncrypted = identity?.password === values.password;

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      {axiosError && (
        <Alert
          variant="danger"
          isInline
          title={getAxiosErrorMessage(axiosError)}
        />
      )}
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
        renderInput={({ field: { value, name } }) => (
          <SimpleSelect
            id="type-select"
            toggleId="type-select-toggle"
            toggleAriaLabel="Type select dropdown toggle"
            aria-label={name}
            value={value ? toOptionLike(value, kindOptions) : undefined}
            options={kindOptions}
            onChange={(selection) => {
              const selectionValue = selection as OptionWithValue<IdentityKind>;
              setValue(name, selectionValue.value);
              // So we don't retain the values from the wrong type of credential
              setValue("user", "");
              setValue("password", "");
            }}
          />
        )}
      />

      {values?.kind === "source" && (
        <>
          <HookFormPFGroupController
            control={control}
            name="userCredentials"
            label="User credentials"
            isRequired
            fieldId="user-credentials-select"
            renderInput={({ field: { value, name } }) => (
              <SimpleSelect
                id="user-credentials-select"
                toggleId="user-credentials-select-toggle"
                toggleAriaLabel="User credentials select dropdown toggle"
                aria-label={name}
                value={
                  value
                    ? toOptionLike(value, userCredentialsOptions)
                    : undefined
                }
                options={userCredentialsOptions}
                onChange={(selection) => {
                  const selectionValue =
                    selection as OptionWithValue<UserCredentials>;
                  setValue(name, selectionValue.value);
                  // So we don't retain the values from the wrong type of credential
                  setValue("user", "");
                  setValue("password", "");
                }}
              />
            )}
          />
          {values?.userCredentials === "userpass" && (
            <>
              <HookFormPFTextInput
                control={control}
                name="user"
                label="Username"
                fieldId="user"
                isRequired
              />
              <HookFormPFTextInput
                control={control}
                name="password"
                label="Password"
                fieldId="password"
                isRequired
                formGroupProps={{
                  labelIcon: !isPasswordEncrypted ? (
                    <KeyDisplayToggle
                      keyName="password"
                      isKeyHidden={isPasswordHidden}
                      onClick={toggleHidePassword}
                    />
                  ) : undefined,
                }}
                type={isPasswordHidden ? "password" : "text"}
                onFocus={() => setValue("password", "")}
              />
            </>
          )}
          {values?.userCredentials === "source" && (
            <>
              <HookFormPFGroupController
                control={control}
                name="key"
                fieldId="key"
                label="Upload your [SCM Private Key] file or paste its contents below."
                errorsSuppressed={isLoading}
                isRequired
                // TODO: PKI crypto validation
                // formGroupProps={isFileRejected ? { validated: "error" } : {}}
                renderInput={({ field: { onChange, value, name } }) => (
                  <FileUpload
                    data-testid="source-key-upload"
                    id="key"
                    name={name}
                    type="text"
                    value={
                      value
                        ? value !== identity?.key
                          ? value
                          : "[Encrypted]"
                        : ""
                    }
                    filename={values.keyFilename}
                    onChange={(value, filename) => {
                      onChange(value);
                      setValue("keyFilename", filename);
                      setIsKeyFileRejected(false);
                    }}
                    dropzoneProps={{
                      // accept: ".csv",
                      //TODO: key file extention types
                      onDropRejected: () => setIsKeyFileRejected(true),
                    }}
                    validated={isKeyFileRejected ? "error" : "default"}
                    filenamePlaceholder="Drag and drop a file or upload one"
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
                onFocus={() => setValue("password", "")}
              />
            </>
          )}
        </>
      )}
      {values?.kind === "maven" && (
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
              value={
                value
                  ? value !== identity?.settings
                    ? value
                    : "[Encrypted]"
                  : ""
              }
              filename={values.settingsFilename}
              onChange={(fileContents, fileName, event) => {
                onChange(fileContents);
                setValue("settingsFilename", fileName);
                setIsSettingsFileRejected(false);
              }}
              dropzoneProps={{
                accept: ".xml",
                onDropRejected: () => setIsSettingsFileRejected(true),
              }}
              validated={isSettingsFileRejected ? "error" : "default"}
              filenamePlaceholder="Drag and drop a file or upload one"
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
      )}

      {values?.kind === "proxy" && (
        <>
          <HookFormPFTextInput
            control={control}
            name="user"
            label="Username"
            fieldId="user"
            isRequired
          />
          <HookFormPFTextInput
            control={control}
            name="password"
            label="Password"
            fieldId="password"
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
            onFocus={() => setValue("password", "")}
          />
        </>
      )}

      <ActionGroup>
        <Button
          type="submit"
          aria-label="submit"
          id="identity-form-submit"
          variant={ButtonVariant.primary}
          isDisabled={
            !isValid || isSubmitting || isValidating || isLoading || !isDirty
          }
        >
          {!identity ? "Create" : "Save"}
        </Button>
        <Button
          type="button"
          id="cancel"
          aria-label="cancel"
          variant={ButtonVariant.link}
          isDisabled={isSubmitting || isValidating}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </ActionGroup>
    </Form>
  );
};
