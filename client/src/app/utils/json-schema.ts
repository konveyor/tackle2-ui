import { isEqual } from "lodash-es";
import { unique } from "radash";

import { JsonSchemaObject } from "@app/api/models";

/**
 * Check if the given schema is functionally empty.
 */
export const isSchemaEmpty = (schema?: JsonSchemaObject): boolean => {
  if (!schema) return true;

  if (schema.type === "object") {
    return Object.keys(schema.properties ?? {}).length === 0;
  }

  if (schema.type === "array") {
    return isSchemaEmpty(schema.items);
  }

  return ["string", "number", "boolean", "integer"].includes(schema.type);
};

/**
 * Combines multiple schemas into a single schema.  Only supports schemas with a root type of "object".
 */
export const combineSchemas = (
  schemas?: JsonSchemaObject[]
): JsonSchemaObject | undefined => {
  if (!schemas) return undefined;

  const baseSchema: JsonSchemaObject = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    properties: {},
    required: [],
  };

  const combinedSchema = schemas.reduce((acc, schema) => {
    if (schema.type === "object") {
      // add all properties to the base schema, overwriting any existing properties
      if (schema.properties) {
        Object.entries(schema.properties).forEach(([key, value]) => {
          acc.properties![key] = value;
        });
      }
      // uniquely add all required properties to the base schema
      if (schema.required) {
        acc.required = unique([...(acc.required ?? []), ...schema.required]);
      }
    }
    return acc;
  }, baseSchema);

  return combinedSchema;
};

/**
 * A Set of all JSON Schema annotation keywords.
 * These keywords describe the schema but do not enforce validation rules.
 * We will strip these before comparing for functional equivalence.
 */
const ANNOTATION_KEYWORDS = new Set([
  "title",
  "description",
  "default",
  "examples",
  "$comment",
  "deprecated",
  "readOnly",
  "writeOnly",
  // '$schema' is debatable, but for "functional equivalence" of a given
  // schema instance, it's often best to compare it too.
]);

/**
 * Recursively strips annotation keywords from a JSON schema object.
 * @param schema The schema (or sub-schema) to strip.
 * @returns A new object containing only the functional keywords.
 */
export function stripAnnotations<T>(schema: T): T {
  // Base case: not an object or null, return as-is
  if (typeof schema !== "object" || schema === null) {
    return schema;
  }

  // Handle arrays by recursively stripping each element
  if (Array.isArray(schema)) {
    return schema.map(stripAnnotations) as T;
  }

  // Handle objects by building a new object without annotation keys
  const strippedSchema: Record<string, unknown> = {};
  for (const key in schema) {
    if (Object.prototype.hasOwnProperty.call(schema, key)) {
      if (!ANNOTATION_KEYWORDS.has(key)) {
        // This is a functional key. Recurse on its value.
        strippedSchema[key] = stripAnnotations(schema[key]);
      }
    }
  }

  return strippedSchema as T;
}

/**
 * Checks if an incoming JSON schema is functionally equivalent to
 * another JSON schema.
 */
export const isEquivalentSchema = (
  schemaA: JsonSchemaObject,
  schemaB: JsonSchemaObject
): boolean => {
  // 1. Strip annotations from the incoming schema
  const functionalSchemaA = stripAnnotations(schemaA);
  const functionalSchemaB = stripAnnotations(schemaB);

  // 2. Deep-compare the two functional schemas.
  // `isEqual` handles deep comparison and is not sensitive to key order.
  return isEqual(functionalSchemaA, functionalSchemaB);
};

/**
 * Generates a validator function that checks if an incoming JSON schema is functionally equivalent to
 * a static base schema.
 */
export const validatorGenerator = (baseSchema: JsonSchemaObject) => {
  const functionalBaseSchema = stripAnnotations(baseSchema);
  return (schema: JsonSchemaObject) => {
    const functionalSchema = stripAnnotations(schema);
    return isEqual(functionalBaseSchema, functionalSchema);
  };
};
