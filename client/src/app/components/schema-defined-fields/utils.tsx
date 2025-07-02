import { JsonSchemaObject } from "@app/api/models";
import * as yup from "yup";

export const jsonSchemaToYupSchema = (
  jsonSchema: JsonSchemaObject,
  t: (key: string, options?: any) => string
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
          yupField = jsonSchemaToYupSchema(prop, t); // Recursive call for nested objects
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

export const isComplexSchema = (schema: JsonSchemaObject): boolean => {
  // Check if the schema itself is complex (array type at root level)
  if (schema.type === "array") {
    return true;
  }

  // Check properties if they exist
  if (schema.properties) {
    for (const key in schema.properties) {
      const prop = schema.properties[key];
      if (prop.type === "array") {
        return true;
      }
      if (prop.type === "object") {
        if (isComplexSchema(prop)) {
          return true;
        }
      }
    }
  }

  return false;
};
