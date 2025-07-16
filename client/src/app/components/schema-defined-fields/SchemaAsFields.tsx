/* eslint-disable no-case-declarations */
import React from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";

import {
  Card,
  CardBody,
  CardTitle,
  Checkbox,
  Form,
  Title,
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
}

export const SchemaAsFields: React.FC<SchemaAsFieldsProps> = ({
  jsonDocument,
  jsonSchema,
  onDocumentSaved,
  onDocumentChanged,
}) => {
  const { t } = useTranslation();

  const handleFormChange = React.useCallback(
    (values: JsonSchemaValues) => {
      if (onDocumentChanged) {
        onDocumentChanged(values);
      }
    },
    [onDocumentChanged]
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<JsonSchemaValues>({
    resolver: jsonSchemaToYupResolver(jsonSchema, t),
    defaultValues: jsonDocument,
    mode: "all",
  });

  React.useEffect(() => {
    const subscription = watch((values) => {
      handleFormChange(values as JsonSchemaValues);
    });
    return () => subscription.unsubscribe();
  }, [watch, handleFormChange]);

  const renderField = (key: string, fieldSchema: any) => {
    const required = jsonSchema.required && jsonSchema.required.includes(key);
    const fieldId = `field-${key}`;
    const errorMessage = errors[key]?.message as string;
    const isValid = !errorMessage;

    switch (fieldSchema.type) {
      case "string":
      case "number":
      case "integer":
        return (
          <HookFormPFTextInput
            control={control}
            name={key}
            label={key}
            fieldId={fieldId}
            isRequired={required}
          />
        );
      case "boolean":
        return (
          <HookFormPFGroupController
            control={control}
            name={key}
            label={key}
            fieldId={fieldId}
            isRequired={required}
            renderInput={({ field: { value, onChange } }) => (
              <>
                <Checkbox
                  id={fieldId}
                  label={key}
                  isChecked={!!value}
                  onChange={onChange}
                  aria-invalid={!isValid}
                  aria-describedby={
                    errorMessage ? `${fieldId}-helper` : undefined
                  }
                />
              </>
            )}
          />
        );
      case "object":
        // Render nested objects recursively
        return (
          <Card
            key={key}
            isPlain
            isCompact
            style={{
              marginTop: "20px",
              border: "1px solid var(--pf-v5-global--BorderColor--100)",
              borderRadius: "4px",
            }}
          >
            <CardTitle>
              <Title headingLevel="h3" size="lg">
                {fieldSchema.title || key}
              </Title>
            </CardTitle>
            <CardBody>
              {Object.keys(fieldSchema.properties || {}).map((nestedKey) =>
                renderField(nestedKey, fieldSchema.properties[nestedKey])
              )}
            </CardBody>
          </Card>
        );
    }
  };

  const onValidSubmit = (values: JsonSchemaValues) => {
    onDocumentSaved && onDocumentSaved(values);
  };

  return (
    <Form onSubmit={handleSubmit(onValidSubmit)} id="schema-as-fields-form">
      {Object.keys(jsonSchema?.properties || {}).map(
        (key) =>
          jsonSchema.properties && renderField(key, jsonSchema.properties[key])
      )}
    </Form>
  );
};
