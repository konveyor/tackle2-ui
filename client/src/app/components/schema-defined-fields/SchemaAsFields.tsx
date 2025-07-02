/* eslint-disable no-case-declarations */
import React from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import {
  ActionGroup,
  Button,
  ButtonVariant,
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

export interface JsonSchemaValues {
  [key: string]: string | string[] | boolean | JsonSchemaValues | undefined;
}

export interface SchemaAsFieldsProps {
  jsonDocument: object;
  jsonSchema: JsonSchemaObject;
  onDocumentSaved?: (newJsonDocument: object) => void;
}

export const SchemaAsFields: React.FC<SchemaAsFieldsProps> = ({
  jsonDocument,
  jsonSchema,
  onDocumentSaved,
}) => {
  const { t } = useTranslation();

  const jsonSchemaToYupSchema = (
    jsonSchema: JsonSchemaObject
  ): yup.AnyObjectSchema => {
    const schemaShape: { [key: string]: yup.AnySchema } = {};

    if (jsonSchema.type === "object" && jsonSchema.properties) {
      for (const key in jsonSchema.properties) {
        const prop = jsonSchema.properties[key];
        let yupField: yup.AnySchema;

        switch (prop.type) {
          case "string": {
            let stringSchema = yup.string();
            if (prop.minLength)
              stringSchema = stringSchema.min(
                prop.minLength,
                t("validation.minLength", { length: prop.minLength })
              );
            if (prop.maxLength)
              stringSchema = stringSchema.max(
                prop.maxLength,
                t("validation.maxLength", { length: prop.maxLength })
              );
            if (prop.pattern)
              stringSchema = stringSchema.matches(
                new RegExp(prop.pattern),
                prop.description || t("validation.invalidFormat")
              );
            if (prop.enum)
              stringSchema = stringSchema.oneOf(
                prop.enum,
                t("validation.invalidValue")
              );
            yupField = stringSchema;
            break;
          }
          case "number":
          case "integer": {
            let numberSchema = yup
              .number()
              .typeError(t("validation.mustBeNumber"));
            if (prop.minimum !== undefined)
              numberSchema = numberSchema.min(
                prop.minimum,
                t("validation.min", { value: prop.minimum })
              );
            if (prop.maximum !== undefined)
              numberSchema = numberSchema.max(
                prop.maximum,
                t("validation.max", { value: prop.maximum })
              );
            yupField = numberSchema;
            break;
          }
          case "boolean": {
            yupField = yup.boolean();
            break;
          }
          case "object": {
            yupField = jsonSchemaToYupSchema(prop); // Recursive call for nested objects
            break;
          }
          default: {
            yupField = yup.mixed(); // Fallback for unknown types
            break;
          }
        }

        if (jsonSchema.required && jsonSchema.required.includes(key)) {
          yupField = yupField.required(t("validation.required"));
        }

        schemaShape[key] = yupField;
      }
    }
    return yup.object().shape(schemaShape);
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValidating, isValid },
  } = useForm<JsonSchemaValues>({
    resolver: yupResolver(jsonSchemaToYupSchema(jsonSchema)),
    defaultValues: jsonDocument,
    mode: "all",
  });

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
      <ActionGroup>
        <Button
          type="submit"
          id="submit"
          aria-label="submit"
          variant={ButtonVariant.primary}
          isDisabled={
            !isValid || isSubmitting || isValidating || !onDocumentSaved
          }
        >
          {t("actions.save")}
        </Button>
        <Button
          type="button"
          id="cancel"
          aria-label="cancel"
          variant={ButtonVariant.link}
          isDisabled={isSubmitting || isValidating}
          onClick={() => reset()}
        >
          {t("actions.reset")}
        </Button>
      </ActionGroup>
    </Form>
  );
};
