import { yupResolver } from "@hookform/resolvers/yup";
import { TFunction } from "i18next";
import * as yup from "yup";

import { JsonSchemaObject } from "@app/api/models";

const fallbackT = (k: string, v?: object) => `${k}: ${JSON.stringify(v)}`;

export const jsonSchemaToYupSchema = (
  jsonSchema: JsonSchemaObject,
  translate?:
    | TFunction<"translation", undefined>
    | ((k: string, v?: object) => string)
): yup.AnySchema => {
  const t = translate || fallbackT;

  if (jsonSchema.type === "array") {
    let schema = yup.array();
    if (jsonSchema.items) {
      schema = schema.of(jsonSchemaToYupSchema(jsonSchema.items, t));
    }

    if (jsonSchema.minItems) {
      schema = schema.min(
        jsonSchema.minItems,
        t("validation.minItems", { count: jsonSchema.minItems })
      );
    }
    if (jsonSchema.maxItems) {
      schema = schema.max(
        jsonSchema.maxItems,
        t("validation.maxItems", { count: jsonSchema.maxItems })
      );
    }
    // TODO: uniqueItems

    return schema;
  }

  if (jsonSchema.type === "object" && !jsonSchema.properties) {
    return yup.object();
  }

  if (jsonSchema.type === "object" && jsonSchema.properties) {
    const props: Record<
      string,
      yup.AnySchema | ReturnType<typeof yup.lazy<yup.AnySchema>>
    > = {};

    for (const [key, prop] of Object.entries(jsonSchema.properties)) {
      const propSchema = jsonSchemaToYupSchema(prop, t);

      if (jsonSchema.required?.includes(key)) {
        props[key] = propSchema.required(
          t("validation.required", { name: key })
        );
      } else {
        // For optional object properties with properties, use lazy validation
        // to avoid validating internal structure when the object is undefined
        if (prop.type === "object" && prop.properties) {
          props[key] = yup.lazy<yup.AnySchema>((value) => {
            if (value === undefined || value === null) {
              return yup.mixed().optional();
            }
            return propSchema;
          });
        } else {
          props[key] = propSchema.optional();
        }
      }
    }

    let objectSchema = yup.object(props);

    // Only apply noUnknown() if additionalProperties is explicitly false
    if (jsonSchema.additionalProperties === false) {
      objectSchema = objectSchema.strict().noUnknown();
    }

    return objectSchema;
  }

  if (jsonSchema.type === "string") {
    let stringSchema = yup.string().strict();
    if (jsonSchema.minLength)
      stringSchema = stringSchema.min(
        jsonSchema.minLength,
        t("validation.minLength", { length: jsonSchema.minLength })
      );
    if (jsonSchema.maxLength)
      stringSchema = stringSchema.max(
        jsonSchema.maxLength,
        t("validation.maxLength", { length: jsonSchema.maxLength })
      );
    if (jsonSchema.pattern)
      stringSchema = stringSchema.matches(
        new RegExp(jsonSchema.pattern),
        jsonSchema.description || t("validation.invalidFormat")
      );
    if (jsonSchema.enum)
      stringSchema = stringSchema.oneOf(
        jsonSchema.enum,
        t("validation.invalidValue")
      );
    return stringSchema;
  }

  if (jsonSchema.type === "number" || jsonSchema.type === "integer") {
    let numberSchema = yup
      .number()
      .strict()
      .typeError(t("validation.mustBeNumber"));
    if (jsonSchema.minimum !== undefined)
      numberSchema = numberSchema.min(
        jsonSchema.minimum,
        t("validation.min", { value: jsonSchema.minimum })
      );
    if (jsonSchema.maximum !== undefined)
      numberSchema = numberSchema.max(
        jsonSchema.maximum,
        t("validation.max", { value: jsonSchema.maximum })
      );
    return numberSchema;
  }

  if (jsonSchema.type === "boolean") {
    return yup.boolean().strict();
  }

  return yup.mixed(); // Fallback for unknown types
};

export const jsonSchemaToYupResolver = (
  jsonSchema: JsonSchemaObject,
  translate?: TFunction<"translation", undefined>
) => {
  const baseYupSchema = jsonSchemaToYupSchema(jsonSchema, translate);

  if (baseYupSchema instanceof yup.ObjectSchema) {
    return yupResolver(baseYupSchema);
  }

  return yupResolver(yup.object({ field: baseYupSchema }));
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
