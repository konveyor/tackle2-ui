/* eslint-disable no-case-declarations */
import React from "react";
import { useTranslation } from "react-i18next";
import { useForm, FormProvider, useFormContext } from "react-hook-form";

import {
  Checkbox,
  Form,
  FormFieldGroup,
  FormFieldGroupHeader,
} from "@patternfly/react-core";

import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { JsonSchemaObject } from "@app/api/models";
import { jsonSchemaToYupResolver } from "./utils";

export interface JsonSchemaValues {
  [key: string]: string | string[] | boolean | JsonSchemaValues | undefined;
}

export interface SchemaAsFieldsProps {
  jsonDocument: object;
  jsonSchema: JsonSchemaObject;
  onDocumentSaved?: (newJsonDocument: object) => void;
  onDocumentChanged?: (newJsonDocument: object) => void;
  isReadOnly?: boolean;
}

interface FieldProps {
  isReadOnly?: boolean;
  fieldKey: string;
  fieldSchema: JsonSchemaObject;
  path: string;
  required?: boolean;
}

const StringField: React.FC<FieldProps> = ({
  isReadOnly,
  fieldKey,
  fieldSchema,
  path,
  required,
}) => {
  const { control } = useFormContext();
  const fieldId = `field-${path}`;

  return (
    <HookFormPFTextInput
      isDisabled={isReadOnly}
      control={control}
      name={path}
      label={fieldSchema.title || fieldKey}
      helperText={fieldSchema.description}
      fieldId={fieldId}
      isRequired={required}
    />
  );
};

const NumberField: React.FC<FieldProps> = ({
  isReadOnly,
  fieldKey,
  fieldSchema,
  path,
  required,
}) => {
  const { control } = useFormContext();
  const fieldId = `field-${path}`;

  return (
    <HookFormPFTextInput
      isDisabled={isReadOnly}
      control={control}
      name={path}
      label={fieldSchema.title || fieldKey}
      helperText={fieldSchema.description}
      fieldId={fieldId}
      isRequired={required}
      type={fieldSchema.type === "integer" ? "integer" : "number"}
    />
  );
};

const BooleanField: React.FC<FieldProps> = ({
  isReadOnly,
  fieldKey,
  fieldSchema,
  path,
  required,
}) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const fieldId = `field-${path}`;
  const errorMessage = errors[path]?.message as string;
  const isValid = !errorMessage;

  return (
    <HookFormPFGroupController
      control={control}
      name={path}
      label={fieldSchema.title || fieldKey}
      helperText={fieldSchema.description}
      fieldId={fieldId}
      isRequired={required}
      renderInput={({ field: { value, onChange } }) => (
        <>
          <Checkbox
            id={fieldId}
            label={fieldSchema.title || fieldKey}
            isDisabled={isReadOnly}
            isChecked={!!value}
            onChange={onChange}
            aria-invalid={!isValid}
            aria-describedby={errorMessage ? `${fieldId}-helper` : undefined}
          />
        </>
      )}
    />
  );
};

const ObjectField: React.FC<FieldProps> = ({
  isReadOnly,
  fieldKey,
  fieldSchema,
  path,
}) => {
  return (
    <FormFieldGroup
      style={{
        gridTemplateColumns: "2rem 1fr",
      }}
      header={
        <FormFieldGroupHeader
          titleText={{
            text: fieldSchema.title || fieldKey,
            id: `field-${path}-title`,
          }}
          titleDescription={fieldSchema.description}
        />
      }
    >
      {Object.keys(fieldSchema.properties || {}).map((nestedKey) => (
        <SchemaField
          isReadOnly={isReadOnly}
          key={nestedKey}
          fieldKey={nestedKey}
          fieldSchema={fieldSchema.properties![nestedKey]}
          path={path ? `${path}.${nestedKey}` : nestedKey}
          parentSchema={fieldSchema}
        />
      ))}
    </FormFieldGroup>
  );
};

interface SchemaFieldProps {
  isReadOnly?: boolean;
  fieldKey: string;
  fieldSchema: JsonSchemaObject;
  path: string;
  parentSchema?: JsonSchemaObject;
}

const SchemaField: React.FC<SchemaFieldProps> = ({
  isReadOnly,
  fieldKey,
  fieldSchema,
  path,
  parentSchema,
}) => {
  const required =
    parentSchema?.required && parentSchema.required.includes(fieldKey);

  switch (fieldSchema.type) {
    case "string":
      return (
        <StringField
          isReadOnly={isReadOnly}
          fieldKey={fieldKey}
          fieldSchema={fieldSchema}
          path={path}
          required={required}
        />
      );
    case "number":
    case "integer":
      return (
        <NumberField
          isReadOnly={isReadOnly}
          fieldKey={fieldKey}
          fieldSchema={fieldSchema}
          path={path}
          required={required}
        />
      );
    case "boolean":
      return (
        <BooleanField
          isReadOnly={isReadOnly}
          fieldKey={fieldKey}
          fieldSchema={fieldSchema}
          path={path}
          required={required}
        />
      );
    case "object":
      return (
        <ObjectField
          isReadOnly={isReadOnly}
          fieldKey={fieldKey}
          fieldSchema={fieldSchema}
          path={path}
          required={required}
        />
      );
    default:
      return null; // TODO: type="array" is not supported yet
  }
};

export const SchemaAsFields: React.FC<SchemaAsFieldsProps> = ({
  jsonDocument,
  jsonSchema,
  onDocumentSaved,
  onDocumentChanged,
  isReadOnly = false,
}) => {
  const { t } = useTranslation();

  const methods = useForm<JsonSchemaValues>({
    resolver: jsonSchemaToYupResolver(jsonSchema, t),
    defaultValues: jsonDocument,
    mode: "all",
  });

  const { handleSubmit, reset, subscribe } = methods;

  // Update form values when jsonDocument prop changes
  React.useEffect(() => {
    reset(jsonDocument);
  }, [jsonDocument, reset]);

  // Call onDocumentChanged when the form values change
  React.useEffect(() => {
    const subscription = subscribe({
      formState: {
        values: true,
        isValid: true,
      },
      callback: ({ isValid, values }) => {
        if (isValid) onDocumentChanged?.(values);
      },
    });
    return () => subscription();
  }, [subscribe, onDocumentChanged]);

  const onValidSubmit = (values: JsonSchemaValues) => {
    onDocumentSaved?.(values);
  };

  return (
    <FormProvider {...methods}>
      <Form onSubmit={handleSubmit(onValidSubmit)} id="schema-as-fields-form">
        {Object.keys(jsonSchema?.properties || {}).map((key) =>
          jsonSchema.properties ? (
            <SchemaField
              isReadOnly={isReadOnly}
              key={key}
              fieldKey={key}
              fieldSchema={jsonSchema.properties[key]}
              path={key}
              parentSchema={jsonSchema}
            />
          ) : null
        )}
      </Form>
    </FormProvider>
  );
};
