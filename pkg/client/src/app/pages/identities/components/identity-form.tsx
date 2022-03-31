import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError, AxiosPromise, AxiosResponse } from "axios";
import { object, string } from "yup";
import {
  ActionGroup,
  Alert,
  Button,
  ButtonVariant,
  FileUpload,
  Form,
  FormGroup,
  TextInput,
} from "@patternfly/react-core";
import { FieldValues, useForm, Controller, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { OptionWithValue, SimpleSelect } from "@app/shared/components";
import { createIdentity, updateIdentity } from "@app/api/rest";
import { Identity } from "@app/api/models";
import {
  getAxiosErrorMessage,
  getValidatedFromError,
  getValidatedFromErrorTouched,
} from "@app/utils/utils";
import schema from "./schema.xsd";
import "./identity-form.css";
const xmllint = require("xmllint");
const { XMLValidator } = require("fast-xml-parser");

export interface IdentityFormProps {
  identity?: Identity;
  onSaved: (response: AxiosResponse<Identity>) => void;
  onCancel: () => void;
}

export const IdentityForm: React.FC<IdentityFormProps> = ({
  identity: initialIdentity,
  onSaved,
  onCancel,
}) => {
  const { t } = useTranslation();

  const [axiosError, setAxiosError] = useState<AxiosError>();
  const [isLoading, setIsLoading] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [identity, setIdentity] = useState(initialIdentity);
  useEffect(() => {
    setIdentity(initialIdentity);
  }, []);
  const getUserCredentialsInitialValue = (
    value?: string,
    identity?: Identity
  ) => {
    switch (value) {
      case "source": {
        if (identity?.user) {
          return { value: "userpass", toString: () => "Username/Password" };
        } else if (identity?.key) {
          return {
            value: "source",
            toString: () => "SCM Private Key/Passphrase",
          };
        } else {
          return { value: "", toString: () => "" };
        }
      }
      default:
        return { value: "", toString: () => "" };
    }
  };
  const getKindInitialValue = (kind?: string): OptionWithValue<any> => {
    switch (kind) {
      case "proxy": {
        return { value: kind, toString: () => "Proxy" };
      }
      case "source": {
        return { value: kind, toString: () => "Source Control" };
      }
      case "maven": {
        return { value: kind, toString: () => "Maven Settings File" };
      }
      default:
        return { value: "", toString: () => "" };
    }
  };

  const validationSchema = object().shape(
    {
      name: string()
        .trim()
        .required(t("validation.required"))
        .min(3, t("validation.minLength", { length: 3 }))
        .max(120, t("validation.maxLength", { length: 120 })),
      description: string()
        .trim()
        .max(250, t("validation.maxLength", { length: 250 })),
      kind: object().shape({
        value: string().min(1, "value required").required(),
        toString: object().required(),
      }),
      settings: string().when("kind.value", {
        is: "maven",
        then: string().required("Must upload xml settings file"),
      }),
      password: string()
        .when("kind", {
          is: (kind: any) => kind?.value === "proxy",
          then: (schema) => schema.required("This field is required."),
          otherwise: (schema) => schema.trim(),
        })
        .when(["kind", "userCredentials"], {
          is: (kind: any, userCredentials: any) =>
            kind?.value === "source" && userCredentials === "Username/Password",
          then: (schema) => schema.required("This field is required."),
          otherwise: (schema) => schema.trim(),
        }),
      key: string()
        .when(["kind", "userCredentials"], {
          is: (kind: any, userCredentials: any) =>
            kind?.value === "source" && userCredentials.value === "source",
          then: (schema) => schema.required("This field is required."),
          otherwise: (schema) => schema.trim(),
        })
        .when("userCredentials", {
          is: (userCredentials: any) =>
            userCredentials === "Source Private Key/Passphrase",
          then: (schema) => schema.required("This field is required."),
        }),
      userCredentials: string().when("kind", {
        is: (kind: any) => kind?.value === "source",
        then: (schema) => schema.required("This field is required."),
        otherwise: (schema) => schema.trim(),
      }),
      user: string().when(["kind", "userCredentials"], {
        is: (kind: any, userCredentials: any) =>
          kind?.value === "source" && userCredentials === "Username/Password",
        then: (schema) => schema.required("This field is required."),
        otherwise: (schema) => schema.trim(),
      }),
    },
    [
      ["kind", "password"],
      ["kind", "user"],
      ["userCredentials", "key"],
      ["userCredentials", "user"],
      ["userCredentials", "kind"],
      ["userCredentials", "password"],
    ]
  );

  const onSubmit = (formValues: FieldValues) => {
    const payload: Identity = {
      name: formValues.name.trim(),
      description: formValues.description.trim(),
      id: formValues.id,
      kind: formValues.kind.value.trim(),
      createUser: formValues.createUser.trim(),
      ...(formValues.kind.value === "maven" && {
        settings: formValues.settings.trim(),
      }),
      ...(formValues.kind.value === "maven" && {
        settingsFilename: formValues.settingsFilename.trim(),
      }),
      password: formValues.password.trim(),
      user: formValues.user.trim(),
      ...(formValues?.kind.value === "source" &&
        formValues?.userCredentials.value === "source" && {
          key: formValues.key.trim(),
        }),
      ...(formValues?.kind.value === "source" &&
        formValues?.userCredentials.value === "source" && {
          keyFilename: formValues.keyFilename.trim(),
        }),
    };

    let promise: AxiosPromise<Identity>;
    if (identity) {
      promise = updateIdentity({
        ...payload,
      });
    } else {
      promise = createIdentity(payload);
    }
    promise
      .then((response) => {
        // formikHelpers.setSubmitting(false);
        onSaved(response);
      })
      .catch((error) => {
        // formikHelpers.setSubmitting(false);
        setAxiosError(error);
      });
  };

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      touchedFields,
      isSubmitting,
      isValidating,
      isValid,
      isDirty,
    },
    getValues,
    setValue,
    setError,
    control,
    reset,
    resetField,
    watch,
  } = useForm({
    defaultValues: {
      application: 0,
      createTime: "",
      createUser: identity?.createUser || "",
      description: identity?.description || "",
      encrypted: identity?.encrypted || "",
      id: identity?.id || 0,
      key: identity?.key || "",
      keyFilename: "",
      kind: getKindInitialValue(identity?.kind),
      userCredentials: getUserCredentialsInitialValue(identity?.kind, identity),
      name: identity?.name || "",
      password: identity?.password || "",
      settings: identity?.settings || "",
      settingsFilename: "",
      updateUser: identity?.updateUser || "",
      user: identity?.user || "",
    },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });
  const values = getValues();

  const identityValuesHaveUpdate = (
    values: FieldValues,
    identity?: Identity
  ) => {
    if (identity?.name === "" && identity) {
      return true;
    } else {
      return (
        values.name !== identity?.name ||
        values.description !== identity?.description ||
        values.kind.value !== identity?.kind ||
        values.user !== identity?.user ||
        values.password !== identity?.password ||
        values.key !== identity?.key ||
        values.settings !== identity?.settings
      );
    }
  };

  useEffect(() => {
    if (identityValuesHaveUpdate(values, identity)) {
      setHasUpdate(true);
    } else {
      setHasUpdate(false);
    }
  }, [values, identity]);

  const [isFileRejected, setIsFileRejected] = useState(false);
  const [isSettingsFileRejected, setIsSettingsFileRejected] = useState(false);

  const handleFileRejected = () => {
    setIsFileRejected(true);
  };

  const validateXML = (value: string | File, filename: string) => {
    const validationObject = XMLValidator.validate(value, {
      allowBooleanAttributes: true,
    });

    if (validationObject === true) {
      validateAgainstSchema(value);
      setValue("settings", value);
      setValue("settingsFilename", filename);
    } else {
      setIsSettingsFileRejected(true);
      setValue("settings", value);
      setValue("settingsFilename", filename);
      setError("settings", validationObject.err?.msg);
    }
  };

  const validateAgainstSchema = (value: string | File) => {
    const currentSchema = schema;

    const validationResult = xmllint.xmllint.validateXML({
      xml: value,
      schema: currentSchema,
    });

    if (!validationResult.errors) {
      setIsSettingsFileRejected(false);
    } else {
      setIsSettingsFileRejected(true);
      setError("settings", validationResult?.errors);
    }
  };

  const watchFields = watch(["kind", "userCredentials"]); // when pass nothing as argument, you are watching everything

  console.log("values", values);
  console.log("errors", errors);
  console.log("isValid", isValid);
  console.log("isValid", isDirty);
  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      {axiosError && (
        <Alert
          variant="danger"
          isInline
          title={getAxiosErrorMessage(axiosError)}
        />
      )}
      <FormGroup
        label="Name"
        fieldId="name"
        isRequired={true}
        validated={getValidatedFromError(errors.name)}
        helperTextInvalid={errors?.name?.message}
      >
        <Controller
          control={control}
          name="name"
          render={({
            field: { onChange, onBlur, value, name, ref },
            fieldState: { invalid, isTouched, isDirty, error },
            formState,
          }) => (
            <TextInput
              onChange={onChange}
              type="text"
              name={name}
              aria-label="name"
              aria-describedby="name"
              isRequired={true}
              value={value}
              validated={getValidatedFromErrorTouched(error, isTouched)}
            />
          )}
        />
      </FormGroup>
      <FormGroup
        label="Description"
        fieldId="description"
        isRequired={false}
        validated={getValidatedFromError(errors.description)}
        helperTextInvalid={errors?.description?.message}
      >
        <Controller
          control={control}
          name="description"
          render={({
            field: { onChange, onBlur, value, name, ref },
            fieldState: { invalid, isTouched, isDirty, error },
            formState,
          }) => (
            <TextInput
              type="text"
              name={name}
              aria-label="description"
              aria-describedby="description"
              isRequired={true}
              onChange={onChange}
              onBlur={onBlur}
              value={value}
              validated={getValidatedFromErrorTouched(error, isTouched)}
            />
          )}
        />
      </FormGroup>
      <FormGroup
        label="Type"
        fieldId="kind"
        isRequired={true}
        validated={errors.kind && "error"}
        helperTextInvalid={errors?.kind && "This field is required"}
      >
        <Controller
          control={control}
          name="kind"
          render={({
            field: { onChange, onBlur, value, name, ref },
            fieldState: { invalid, isTouched, isDirty, error },
            formState,
          }) => (
            <SimpleSelect
              aria-label={name}
              value={value ? value.toString() : undefined}
              options={[
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
              ]}
              // options.map(toOptionWithValue)}
              onChange={(selection) => {
                const selectionValue = selection as OptionWithValue<any>;
                setValue(name, selectionValue);
              }}
            />
          )}
        />
      </FormGroup>
      {values?.kind?.value === "source" && (
        <>
          <FormGroup
            label="User credentials"
            isRequired
            fieldId="userCredentials"
            validated={errors.userCredentials && "error"}
            helperTextInvalid={
              errors?.userCredentials && "This field is required"
            }
          >
            <Controller
              control={control}
              name="userCredentials"
              render={({
                field: { onChange, onBlur, value, name, ref },
                fieldState: { invalid, isTouched, isDirty, error },
                formState,
              }) => (
                <SimpleSelect
                  aria-label={name}
                  value={value.toString()}
                  options={[
                    {
                      value: "userpass",
                      toString: () => `Username/Password`,
                    },
                    {
                      value: "source",
                      toString: () => `Source Private Key/Passphrase`,
                    },
                  ]}
                  onChange={(selection) => {
                    const selectionValue = selection as OptionWithValue<any>;
                    setValue(name, selectionValue);
                  }}
                />
              )}
            />
          </FormGroup>
          {values?.userCredentials?.value === "userpass" && (
            <>
              <FormGroup
                label="Username"
                fieldId="user"
                isRequired={true}
                validated={getValidatedFromError(errors.user)}
                helperTextInvalid={errors?.user?.message}
              >
                <Controller
                  control={control}
                  name="user"
                  render={({
                    field: { onChange, onBlur, value, name, ref },
                    fieldState: { invalid, isTouched, isDirty, error },
                    formState,
                  }) => (
                    <TextInput
                      type="text"
                      name={name}
                      aria-label="user"
                      aria-describedby="user"
                      isRequired={true}
                      onChange={onChange}
                      onBlur={onBlur}
                      value={value}
                      validated={getValidatedFromErrorTouched(error, isTouched)}
                    />
                  )}
                />
              </FormGroup>
              <FormGroup
                label="Password"
                fieldId="password"
                isRequired={true}
                validated={getValidatedFromError(errors.password)}
                helperTextInvalid={errors?.password?.message}
              >
                <Controller
                  control={control}
                  name="password"
                  render={({
                    field: { onChange, onBlur, value, name, ref },
                    fieldState: { invalid, isTouched, isDirty, error },
                    formState,
                  }) => (
                    <TextInput
                      type="password"
                      name={name}
                      aria-label="password"
                      aria-describedby="password"
                      isRequired={true}
                      onChange={onChange}
                      onBlur={onBlur}
                      value={value}
                      validated={getValidatedFromErrorTouched(error, isTouched)}
                    />
                  )}
                />
              </FormGroup>
            </>
          )}
          {values?.userCredentials.value === "source" && (
            <>
              <FormGroup
                fieldId="key"
                label={
                  "Upload your [SCM Private Key] file or paste its contents below."
                }
                helperTextInvalid="You should select a private key file."
                //TODO: PKI crypto validation
                // validated={isFileRejected ? "error" : "default"}
              >
                <Controller
                  control={control}
                  name="key"
                  render={({
                    field: { onChange, onBlur, value, name, ref },
                    fieldState: { invalid, isTouched, isDirty, error },
                    formState,
                  }) => (
                    <FileUpload
                      id="file"
                      name={name}
                      type="text"
                      value={value}
                      filename={values.keyFilename}
                      onChange={(value, filename) => {
                        setValue("key", value);
                        setValue("keyFilename", filename);
                      }}
                      dropzoneProps={{
                        // accept: ".csv",
                        //TODO: key file extention types
                        onDropRejected: handleFileRejected,
                      }}
                      validated={isFileRejected ? "error" : "default"}
                      filenamePlaceholder="Drag and drop a file or upload one"
                      onFileInputChange={(event, file) => {
                        setValue(name, file);
                        setValue("keyFilename", file.name);
                      }}
                      onClearClick={() => {
                        resetField("key");
                        resetField("keyFilename");
                      }}
                      allowEditingUploadedText
                      browseButtonText="Upload"
                    />
                  )}
                />
              </FormGroup>
              <FormGroup label="Private Key Passphrase" fieldId="password">
                <Controller
                  control={control}
                  name="password"
                  render={({
                    field: { onChange, onBlur, value, name, ref },
                    fieldState: { invalid, isTouched, isDirty, error },
                    formState,
                  }) => (
                    <TextInput
                      type="password"
                      name={name}
                      aria-label="Private Key Passphrase"
                      aria-describedby="Private Key Passphrase"
                      onChange={onChange}
                      onBlur={onBlur}
                      value={value}
                    />
                  )}
                />
              </FormGroup>
            </>
          )}
        </>
      )}
      {values?.kind?.value === "maven" && (
        <>
          <FormGroup
            fieldId="settings"
            label={"Upload your Settings file or paste its contents below."}
            isRequired={values.kind?.value === "maven"}
            validated={getValidatedFromError(errors.settings)}
            helperTextInvalid={errors?.settings?.message}
          >
            <Controller
              control={control}
              name="key"
              render={({
                field: { onChange, onBlur, value, name, ref },
                fieldState: { invalid, isTouched, isDirty, error },
                formState,
              }) => (
                <FileUpload
                  id="file"
                  name="settings"
                  type="text"
                  value={values.settings && "[Encrypted]"}
                  filename={values.settingsFilename}
                  onChange={(value, filename) => {
                    if (value) {
                      validateXML(value, filename);
                    }
                  }}
                  dropzoneProps={{
                    accept: ".xml",
                    onDropRejected: handleFileRejected,
                  }}
                  validated={isSettingsFileRejected ? "error" : "default"}
                  filenamePlaceholder="Drag and drop a file or upload one"
                  onFileInputChange={(event, file) => {
                    setValue(name, file);
                    setValue("settingsFilename", file.name);
                  }}
                  onClearClick={() => {
                    resetField("settings");
                    resetField("settingsFilename");
                  }}
                  onReadStarted={() => setIsLoading(true)}
                  onReadFinished={() => setIsLoading(false)}
                  isLoading={isLoading}
                  allowEditingUploadedText
                  browseButtonText="Upload"
                />
              )}
            />
          </FormGroup>
        </>
      )}

      {values?.kind?.value === "proxy" && (
        <>
          <FormGroup
            label="Username"
            fieldId="user"
            isRequired={true}
            validated={getValidatedFromError(errors.user)}
            helperTextInvalid={errors?.user?.message}
          >
            <Controller
              control={control}
              name="user"
              render={({
                field: { onChange, onBlur, value, name, ref },
                fieldState: { invalid, isTouched, isDirty, error },
                formState,
              }) => (
                <TextInput
                  type="text"
                  name="user"
                  aria-label="user"
                  aria-describedby="user"
                  isRequired={true}
                  onChange={onChange}
                  onBlur={onBlur}
                  value={value}
                  validated={getValidatedFromErrorTouched(error, isTouched)}
                />
              )}
            />
          </FormGroup>
          <FormGroup
            label="Password"
            fieldId="password"
            isRequired={true}
            validated={getValidatedFromError(errors.password)}
            helperTextInvalid={errors?.password?.message}
          >
            <Controller
              control={control}
              name="password"
              render={({
                field: { onChange, onBlur, value, name, ref },
                fieldState: { invalid, isTouched, isDirty, error },
                formState,
              }) => (
                <TextInput
                  type="password"
                  name={name}
                  aria-label="password"
                  aria-describedby="password"
                  isRequired={true}
                  onChange={onChange}
                  onBlur={onBlur}
                  value={value}
                  validated={getValidatedFromErrorTouched(error, isTouched)}
                />
              )}
            />
          </FormGroup>
        </>
      )}

      <ActionGroup>
        <Button
          type="submit"
          aria-label="submit"
          variant={ButtonVariant.primary}
          isDisabled={
            !isValid || isSubmitting || isValidating || isLoading || !isDirty
            // !hasUpdate
          }
        >
          {!identity ? "Create" : "Save"}
        </Button>
        <Button
          type="button"
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
