import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError, AxiosPromise, AxiosResponse } from "axios";
import { useFormik, FormikProvider, FormikHelpers, useField } from "formik";
import { object, string } from "yup";
import {
  ActionGroup,
  Alert,
  Button,
  ButtonVariant,
  ExpandableSection,
  FileUpload,
  Form,
  FormGroup,
  SelectVariant,
  TextArea,
  TextInput,
} from "@patternfly/react-core";

import {
  OptionWithValue,
  SingleSelectFetchOptionValueFormikField,
} from "@app/shared/components";
import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { createIdentity, TagTypeSortBy, updateIdentity } from "@app/api/rest";
import { Identity, Tag } from "@app/api/models";
import {
  getAxiosErrorMessage,
  getValidatedFromError,
  getValidatedFromErrorTouched,
} from "@app/utils/utils";
import "./identity-form.css";
import { c_options_menu__toggle_active_BorderBottomColor } from "@patternfly/react-tokens";
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
  schema: string;
  schemaFilename: string;
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

  const initialValues: FormValues = {
    application: 0,
    createTime: "",
    createUser: identity?.createUser || "",
    description: identity?.description || "",
    encrypted: identity?.encrypted || "",
    id: identity?.id || 0,
    key: identity?.key || "",
    kind: "",
    userCredentials: "",
    // kind: { value: "", toString: () => "" },
    name: identity?.name || "",
    password: identity?.password || "",
    settings: identity?.settings || "",
    updateUser: identity?.updateUser || "",
    user: identity?.user || "",
    keyFilename: "",
    settingsFilename: "",
    schemaFilename: "",
    schema: "",
  };

  const validationSchema = object().shape({
    name: string()
      .trim()
      .required(t("validation.required"))
      .min(3, t("validation.minLength", { length: 3 }))
      .max(120, t("validation.maxLength", { length: 120 })),
    description: string()
      .trim()
      .max(250, t("validation.maxLength", { length: 250 })),
  });

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
      encrypted: formValues.encrypted.trim(),
    };

    let promise: AxiosPromise<Identity>;
    if (identity) {
      promise = updateIdentity({
        ...identity,
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
    enableReinitialize: true,
    initialValues: initialValues,
    validationSchema: validationSchema,
    onSubmit: onSubmit,
  });

  const onChangeField = (value: string, event: React.FormEvent<any>) => {
    formik.handleChange(event);
  };

  const [file, setFile] = useState<File>();
  const [isFileRejected, setIsFileRejected] = useState(false);
  const [isSettingsFileRejected, setIsSettingsFileRejected] = useState(false);

  const handleFileRejected = () => {
    setIsFileRejected(true);
  };
  const handleFileInputChange = (event, file, fieldName, fieldFileName) => {
    formik.handleChange(event);
    formik.setFieldValue(fieldName, file);
    formik.setFieldValue(fieldFileName, file.name);
  };
  const handleTextOrDataChange = (value, fieldName) => {
    formik.setFieldValue(fieldName, value);
  };

  const handleFileReadStarted = () => setIsLoading(true);
  const handleFileReadFinished = () => setIsLoading(false);

  const validateXML = (value, filename) => {
    const validationObject = XMLValidator.validate(value, {
      allowBooleanAttributes: true,
    });

    if (validationObject === true) {
      setIsSettingsFileRejected(false);
    } else {
      setIsSettingsFileRejected(true);
      formik.setFieldError("settings", validationObject.err?.msg);
      // formik.errors.settings = validationObject.err?.msg;
    }
    formik.setFieldValue("settings", value);
    formik.setFieldValue("settingsFilename", filename); // }
  };

  const validateAgainstSchema = (value, filename, schema?) => {
    const currentSchema = formik.values?.schema || schema;

    const validationResult = xmllint.xmllint.validateXML({
      xml: value,
      ...(currentSchema && { currentSchema }),
    });

    if (!validationResult.errors) {
      // it was valid
      // formik.setFieldValue("settings", value);
      // formik.setFieldValue("settingsFilename", filename); // }
      setIsSettingsFileRejected(false);
    } else {
      console.log("validationResult", validationResult.errors);
      setIsSettingsFileRejected(true);
      formik.setFieldError("settings", validationResult?.errors);
    }
  };
  console.log("isSettingsfilerej", isSettingsFileRejected);
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
          fieldId="type"
          isRequired={true}
          validated={getValidatedFromError(formik.errors.kind)}
          helperTextInvalid={formik.errors.kind}
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
                value: "scm",
                toString: () => `Source Control`,
              },
              {
                value: "mvn",
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
        {formik.values?.kind?.value === "scm" && (
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
                    value: "scm",
                    toString: () => `SCM Private Key/Passphrase`,
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
            {formik.values?.userCredentials.value === "userpass" && (
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
            {formik.values?.userCredentials.value === "scm" && (
              <>
                <FormGroup
                  fieldId="key"
                  label={
                    "Upload your [SCM Private Key] file or paste its contents below."
                  }
                  helperTextInvalid="You should select a private key file."
                  // validated={isFileRejected ? "error" : "default"}
                >
                  <FileUpload
                    id="file"
                    name="file"
                    type="text"
                    value={formik.values.key}
                    filename={formik.values.keyFilename}
                    onChange={(value, filename) => {
                      formik.setFieldValue("key", value);
                      formik.setFieldValue("keyFilename", filename);
                    }}
                    dropzoneProps={{
                      // accept: ".csv",
                      onDropRejected: handleFileRejected,
                    }}
                    validated={isFileRejected ? "error" : "default"}
                    filenamePlaceholder="Drag and drop a file or upload one"
                    onFileInputChange={(event, file) =>
                      handleFileInputChange(event, file, "keyFilename", "key")
                    }
                    onDataChange={(data) => handleTextOrDataChange(data, "key")}
                    onClearClick={() => {
                      formik.setFieldValue("key", "");
                      formik.setFieldValue("keyFilename", "");
                    }}
                    onTextChange={(text) => {
                      handleTextOrDataChange(text, "key");
                    }}
                    onReadStarted={handleFileReadStarted}
                    onReadFinished={handleFileReadFinished}
                    // isLoading={isLoading}
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
        {formik.values?.kind?.value === "mvn" && (
          <>
            <FormGroup
              fieldId="settings"
              label={"Upload your Settings file or paste its contents below."}
              helperTextInvalid="You should select a valid settings.xml file."
              validated={isSettingsFileRejected ? "error" : "default"}
            >
              <FileUpload
                id="file"
                name="file"
                type="text"
                value={formik.values.settings}
                filename={formik.values.settingsFilename}
                onChange={(value, filename) => {
                  validateXML(value, filename);
                  if (formik.values?.schema)
                    validateAgainstSchema(value, filename);
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
                onDataChange={(data) =>
                  handleTextOrDataChange(data, "settings")
                }
                onClearClick={() => {
                  formik.setFieldValue("settings", "");
                  formik.setFieldValue("settingsFilename", "");
                }}
                onTextChange={(text) => {
                  handleTextOrDataChange(text, "settings");
                }}
                onReadStarted={handleFileReadStarted}
                onReadFinished={handleFileReadFinished}
                isLoading={isLoading}
                allowEditingUploadedText
                browseButtonText="Upload"
              />
            </FormGroup>
            <FormGroup
              fieldId="schema"
              label={"Upload your Schema file or paste its contents below."}
              // helperTextInvalid="You should select a schema file."
              // validated={isFileRejected ? "error" : "default"}
            >
              <FileUpload
                id="file"
                name="file"
                type="text"
                value={formik.values.schema}
                filename={formik.values.schemaFilename}
                onChange={(value, filename) => {
                  formik.setFieldValue("schema", value);
                  formik.setFieldValue("schemaFilename", filename); // }
                  validateAgainstSchema(
                    formik.values.settings,
                    formik.values.settingsFilename,
                    value
                  );
                }}
                dropzoneProps={{
                  accept: ".xsd",
                  onDropRejected: handleFileRejected,
                }}
                validated={isFileRejected ? "error" : "default"}
                filenamePlaceholder="Drag and drop a file or upload one"
                onFileInputChange={(event, file) =>
                  handleFileInputChange(event, file, "schemaFilename", "schema")
                }
                onDataChange={(data) => handleTextOrDataChange(data, "schema")}
                onClearClick={() => {
                  formik.setFieldValue("schema", "");
                  formik.setFieldValue("schemaFilename", "");
                }}
                onTextChange={(text) => {
                  handleTextOrDataChange(text, "schema");
                }}
                onReadStarted={handleFileReadStarted}
                onReadFinished={handleFileReadFinished}
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
              !formik.dirty ||
              formik.isSubmitting ||
              formik.isValidating
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
