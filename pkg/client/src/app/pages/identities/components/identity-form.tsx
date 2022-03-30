import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError, AxiosPromise, AxiosResponse } from "axios";
import { useFormik, FormikProvider, FormikHelpers } from "formik";
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

import {
  OptionWithValue,
  SingleSelectFetchOptionValueFormikField,
} from "@app/shared/components";
import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
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

export interface FormValues {
  application: number;
  createTime: string;
  createUser: string;
  description: string;
  encrypted: string;
  id: number;
  key: string;
  kind: OptionWithValue<"" | string>;
  name: string;
  password: string;
  settings: string;
  updateUser: string;
  user: string;
  userCredentials: OptionWithValue<"" | string>;
  keyFilename: string;
  settingsFilename: string;
}

export interface IdentityFormProps {
  identity?: Identity;
  onSaved: (response: AxiosResponse<Identity>) => void;
  onCancel: () => void;
}

export const IdentityForm: React.FC<IdentityFormProps> = ({
  identity,
  onSaved,
  onCancel,
}) => {
  const { t } = useTranslation();

  const [error, setError] = useState<AxiosError>();
  const [isLoading, setIsLoading] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);

  const getUserCredentialsInitialValue = (
    value: string,
    identity: Identity
  ) => {
    switch (value) {
      case "source": {
        if (identity.user) {
          return { value: "userpass", toString: () => "Username/Password" };
        } else {
          return {
            value: "source",
            toString: () => "SCM Private Key/Passphrase",
          };
        }
      }
      default:
        return { value: "", toString: () => "" };
    }
  };
  const getKindInitialValue = (value: string) => {
    switch (value) {
      case "proxy": {
        return { value: value, toString: () => "Proxy" };
      }
      case "source": {
        return { value: value, toString: () => "Source Control" };
      }
      case "maven": {
        return { value: value, toString: () => "Maven Settings File" };
      }
      default:
        return { value: "", toString: () => "" };
    }
  };
  const kindInitialValue = useMemo(() => {
    return identity?.kind
      ? getKindInitialValue(identity.kind)
      : { value: "", toString: () => "" };
  }, [identity]);

  const userCredentialsInitialValue = useMemo(() => {
    return identity && identity.kind
      ? getUserCredentialsInitialValue(identity.kind, identity)
      : { value: "", toString: () => "" };
  }, [identity]);

  const initialValues: FormValues = {
    application: 0,
    createTime: "",
    createUser: identity?.createUser || "",
    description: identity?.description || "",
    encrypted: identity?.encrypted || "",
    id: identity?.id || 0,
    key: identity?.key || "",
    keyFilename: "",
    kind: kindInitialValue,
    userCredentials: userCredentialsInitialValue,
    name: identity?.name || "",
    password: identity?.password || "",
    settings: identity?.settings || "",
    settingsFilename: "",
    updateUser: identity?.updateUser || "",
    user: identity?.user || "",
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
      user: string()
        .when("kind", {
          is: (kind: any) => kind.value === "proxy",
          then: (schema) => schema.required("This field is required."),
          otherwise: (schema) => schema.trim(),
        })
        .when("kind", {
          is: (kind: any) => kind.value === "source",
          then: (schema) => schema.required("This field is required."),
          otherwise: (schema) => schema.trim(),
        }),
      password: string()
        .when("kind", {
          is: (kind: any) => kind.value === "proxy",
          then: (schema) => schema.required("This field is required."),
          otherwise: (schema) => schema.trim(),
        })
        .when("kind", {
          is: (kind: any) => kind.value === "source",
          then: (schema) => schema.required("This field is required."),
          otherwise: (schema) => schema.trim(),
        }),
      key: string().when("kind", {
        is: (kind: any) => kind.value === "source",
        then: (schema) => schema.required("This field is required."),
        otherwise: (schema) => schema.trim(),
      }),
    },
    [
      ["kind", "password"],
      ["kind", "username"],
      ["kind", "key"],
    ]
  );

  const onSubmit = (
    formValues: FormValues,
    formikHelpers: FormikHelpers<FormValues>
  ) => {
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
        formikHelpers.setSubmitting(false);
        onSaved(response);
      })
      .catch((error) => {
        formikHelpers.setSubmitting(false);
        setError(error);
      });
  };

  const formik = useFormik({
    enableReinitialize: false,
    initialValues: initialValues,
    validationSchema: validationSchema,
    onSubmit: onSubmit,
  });

  const identityValuesHaveUpdate = (
    values: FormValues,
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
    if (identityValuesHaveUpdate(formik.values, identity)) {
      setHasUpdate(true);
    } else {
      setHasUpdate(false);
    }
  }, [formik.values, identity]);

  const onChangeField = (value: string, event: React.FormEvent<any>) => {
    formik.handleChange(event);
  };

  const [isFileRejected, setIsFileRejected] = useState(false);
  const [isSettingsFileRejected, setIsSettingsFileRejected] = useState(false);

  const handleFileRejected = () => {
    setIsFileRejected(true);
  };
  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLElement>,
    file: File,
    fieldName: string,
    fieldFileName: string
  ) => {
    formik.handleChange(event);
    formik.setFieldValue(fieldName, file);
    formik.setFieldValue(fieldFileName, file.name);
  };

  const validateXML = (value: string | File, filename: string) => {
    const validationObject = XMLValidator.validate(value, {
      allowBooleanAttributes: true,
    });

    if (validationObject === true) {
      validateAgainstSchema(value);
      formik.setFieldValue("settings", value, false);
      formik.setFieldValue("settingsFilename", filename, false);
    } else {
      setIsSettingsFileRejected(true);
      formik.setFieldValue("settings", value, false);
      formik.setFieldValue("settingsFilename", filename, false);
      formik.setFieldError("settings", validationObject.err?.msg);
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
      formik.setFieldError("settings", validationResult?.errors);
    }
  };
  console.log("formik", formik);
  // const handleFileInputChange = (event, file) => this.setState({ filename: file.name });
  // const handleTextOrDataChange = value => this.setState({ value });
  // const handleClear = event => this.setState({ filename: '', value: '' });
  // const handleFileReadStarted = fileHandle => this.setState({ isLoading: true });
  // const handleFileReadFinished = fileHandle => this.setState({ isLoading: false });
  return (
    <FormikProvider value={formik}>
      <Form onSubmit={formik.handleSubmit}>
        {error && (
          <Alert
            variant="danger"
            isInline
            title={getAxiosErrorMessage(error)}
          />
        )}
        <FormGroup
          label="Name"
          fieldId="name"
          isRequired={true}
          validated={getValidatedFromError(formik.errors.name)}
          helperTextInvalid={formik.errors.name}
        >
          <TextInput
            type="text"
            name="name"
            aria-label="name"
            aria-describedby="name"
            isRequired={true}
            onChange={onChangeField}
            onBlur={formik.handleBlur}
            value={formik.values.name}
            validated={getValidatedFromErrorTouched(
              formik.errors.name,
              formik.touched.name
            )}
          />
        </FormGroup>
        <FormGroup
          label="Description"
          fieldId="description"
          isRequired={false}
          validated={getValidatedFromError(formik.errors.description)}
          helperTextInvalid={formik.errors.description}
        >
          <TextInput
            type="text"
            name="description"
            aria-label="description"
            aria-describedby="description"
            isRequired={true}
            onChange={onChangeField}
            onBlur={formik.handleBlur}
            value={formik.values.description}
            validated={getValidatedFromErrorTouched(
              formik.errors.description,
              formik.touched.description
            )}
          />
        </FormGroup>
        <FormGroup
          label="Type"
          fieldId="kind"
          isRequired={true}
          validated={formik.errors.kind && "error"}
          helperTextInvalid={formik.errors.kind && "This field is required"}
        >
          <SingleSelectFetchOptionValueFormikField
            fieldConfig={{ name: "kind" }}
            selectConfig={{
              variant: "typeahead",
              "aria-label": "type",
              "aria-describedby": "type",
              typeAheadAriaLabel: "type",
              toggleAriaLabel: "type",
              clearSelectionsAriaLabel: "type",
              removeSelectionAriaLabel: "type",
              placeholderText: "Select identity type",
              menuAppendTo: () => document.body,
              maxHeight: DEFAULT_SELECT_MAX_HEIGHT,
              fetchError: undefined,
              isFetching: false,
            }}
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
            toOptionWithValue={(value) => {
              return {
                value,
                toString: () => value.toString(),
              };
            }}
          />
        </FormGroup>
        {formik.values?.kind?.value === "source" && (
          <>
            <FormGroup
              label="User credentials"
              isRequired
              fieldId="userCredentials"
            >
              <SingleSelectFetchOptionValueFormikField
                fieldConfig={{ name: "userCredentials" }}
                selectConfig={{
                  variant: "typeahead",
                  "aria-label": "userCredentials",
                  "aria-describedby": "userCredentials",
                  typeAheadAriaLabel: "userCredentials",
                  toggleAriaLabel: "userCredentials",
                  clearSelectionsAriaLabel: "userCredentials",
                  removeSelectionAriaLabel: "userCredentials",
                  placeholderText: "",
                  menuAppendTo: () => document.body,
                  maxHeight: DEFAULT_SELECT_MAX_HEIGHT,
                  fetchError: undefined,
                  isFetching: false,
                }}
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
                toOptionWithValue={(value) => {
                  return {
                    value,
                    toString: () => value.toString(),
                  };
                }}
              />
            </FormGroup>
            {formik.values?.userCredentials?.value === "userpass" && (
              <>
                <FormGroup
                  label="Username"
                  fieldId="user"
                  isRequired={true}
                  validated={getValidatedFromError(formik.errors.user)}
                  helperTextInvalid={formik.errors.user}
                >
                  <TextInput
                    type="text"
                    name="user"
                    aria-label="user"
                    aria-describedby="user"
                    isRequired={true}
                    onChange={onChangeField}
                    onBlur={formik.handleBlur}
                    value={formik.values.user}
                    validated={getValidatedFromErrorTouched(
                      formik.errors.user,
                      formik.touched.user
                    )}
                  />
                </FormGroup>
                <FormGroup
                  label="Password"
                  fieldId="password"
                  isRequired={true}
                  validated={getValidatedFromError(formik.errors.password)}
                  helperTextInvalid={formik.errors.password}
                >
                  <TextInput
                    type="password"
                    name="password"
                    aria-label="password"
                    aria-describedby="password"
                    isRequired={true}
                    onChange={onChangeField}
                    onBlur={formik.handleBlur}
                    value={formik.values.password}
                    validated={getValidatedFromErrorTouched(
                      formik.errors.password,
                      formik.touched.password
                    )}
                  />
                </FormGroup>
              </>
            )}
            {formik.values?.userCredentials.value === "source" && (
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
                  <FileUpload
                    id="file"
                    name="key"
                    type="text"
                    value={formik.values.key}
                    filename={formik.values.keyFilename}
                    onChange={(value, filename) => {
                      formik.setFieldValue("key", value);
                      formik.setFieldValue("keyFilename", filename);
                    }}
                    dropzoneProps={{
                      // accept: ".csv",
                      //TODO: key file extention types
                      onDropRejected: handleFileRejected,
                    }}
                    validated={isFileRejected ? "error" : "default"}
                    filenamePlaceholder="Drag and drop a file or upload one"
                    onFileInputChange={(event, file) =>
                      handleFileInputChange(event, file, "keyFilename", "key")
                    }
                    // onDataChange={this.handleTextOrDataChange}
                    // onTextChange={this.handleTextOrDataChange}
                    // onReadStarted={this.handleFileReadStarted}
                    // onReadFinished={this.handleFileReadFinished}
                    onClearClick={() => {
                      formik.setFieldValue("key", "");
                      formik.setFieldValue("keyFilename", "");
                    }}
                    allowEditingUploadedText
                    browseButtonText="Upload"
                  />
                </FormGroup>
                <FormGroup
                  label="Private Key Passphrase"
                  fieldId="password"
                  isRequired={false}
                  validated={getValidatedFromError(formik.errors.password)}
                  helperTextInvalid={formik.errors.password}
                >
                  <TextInput
                    type="password"
                    name="password"
                    aria-label="Private Key Passphrase"
                    aria-describedby="Private Key Passphrase"
                    isRequired={true}
                    onChange={onChangeField}
                    onBlur={formik.handleBlur}
                    value={formik.values.password}
                    validated={getValidatedFromErrorTouched(
                      formik.errors.password,
                      formik.touched.password
                    )}
                  />
                </FormGroup>
              </>
            )}
          </>
        )}
        {formik.values?.kind?.value === "maven" && (
          <>
            <FormGroup
              fieldId="settings"
              label={"Upload your Settings file or paste its contents below."}
              isRequired={formik.values.kind?.value === "maven"}
              validated={getValidatedFromError(formik.errors.settings)}
              helperTextInvalid={formik.errors.settings}
            >
              <FileUpload
                id="file"
                name="settings"
                type="text"
                value={formik.values.settings && "[Encrypted]"}
                filename={formik.values.settingsFilename}
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
                onFileInputChange={(event, file) =>
                  handleFileInputChange(
                    event,
                    file,
                    "settingsFilename",
                    "settings"
                  )
                }
                onClearClick={() => {
                  formik.setFieldValue("settings", "", false);
                  formik.setFieldValue("settingsFilename", "", false);
                }}
                onReadStarted={() => setIsLoading(true)}
                onReadFinished={() => setIsLoading(false)}
                isLoading={isLoading}
                allowEditingUploadedText
                browseButtonText="Upload"
              />
            </FormGroup>
          </>
        )}

        {formik.values?.kind?.value === "proxy" && (
          <>
            <FormGroup
              label="Username"
              fieldId="user"
              isRequired={true}
              validated={getValidatedFromError(formik.errors.user)}
              helperTextInvalid={formik.errors.user}
            >
              <TextInput
                type="text"
                name="user"
                aria-label="user"
                aria-describedby="user"
                isRequired={true}
                onChange={onChangeField}
                onBlur={formik.handleBlur}
                value={formik.values.user}
                validated={getValidatedFromErrorTouched(
                  formik.errors.user,
                  formik.touched.user
                )}
              />
            </FormGroup>
            <FormGroup
              label="Password"
              fieldId="password"
              isRequired={true}
              validated={getValidatedFromError(formik.errors.password)}
              helperTextInvalid={formik.errors.password}
            >
              <TextInput
                type="password"
                name="password"
                aria-label="password"
                aria-describedby="password"
                isRequired={true}
                onChange={onChangeField}
                onBlur={formik.handleBlur}
                value={formik.values.password}
                validated={getValidatedFromErrorTouched(
                  formik.errors.password,
                  formik.touched.password
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
              !formik.isValid ||
              formik.isSubmitting ||
              formik.isValidating ||
              isLoading ||
              // !formik.dirty ||
              !hasUpdate
            }
          >
            {!identity ? "Create" : "Save"}
          </Button>
          <Button
            type="button"
            aria-label="cancel"
            variant={ButtonVariant.link}
            isDisabled={formik.isSubmitting || formik.isValidating}
            onClick={onCancel}
          >
            Cancel
          </Button>
        </ActionGroup>
      </Form>
    </FormikProvider>
  );
};
