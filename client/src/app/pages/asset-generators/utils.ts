import { JsonSchemaObject } from "@app/api/models";

/**
 * Helper functions for parameter conversion between Record and Array formats
 */

/**
 * Converts parameters from Record format to Array format
 */
export const parametersToArray = (
  params?: Record<string, unknown>
): Array<{ key: string; value: string }> => {
  if (!params) return [];
  return Object.entries(params).map(([key, value]) => ({
    key,
    value: String(value),
  }));
};

/**
 * Converts parameters from Array format to Record format
 */
export const arrayToParameters = (
  params: Array<{ key: string; value: string }> | undefined
): Record<string, string> => {
  if (!params) return {};

  return Object.fromEntries(params.map(({ key, value }) => [key, value]));
};

/**
 * A single generator parameter as edited in the authoring form.
 */
export type ParameterType = "string" | "integer" | "number" | "boolean";

export interface GeneratorParameter {
  name: string;
  type: ParameterType;
  default: string | number | boolean;
}

export const PARAMETER_TYPES: ParameterType[] = [
  "string",
  "integer",
  "number",
  "boolean",
];

const isSet = (value: unknown): boolean =>
  value !== undefined && value !== null && value !== "";

/** Coerce a default value entered in the form to match the parameter type. */
const coerceDefault = (
  value: GeneratorParameter["default"],
  type: ParameterType
): string | number | boolean => {
  if (type === "integer" || type === "number") return Number(value);
  if (type === "boolean") return value === true || value === "true";
  return String(value);
};

/**
 * Converts authoring-form parameter rows into a JSON Schema document
 * (the format stored in Generator.params and consumed at generation time).
 */
export const parametersToSchema = (
  params: GeneratorParameter[]
): JsonSchemaObject => {
  const properties: { [key: string]: JsonSchemaObject } = {};

  params.forEach((p) => {
    const property: JsonSchemaObject = { type: p.type };
    if (isSet(p.default)) property.default = coerceDefault(p.default, p.type);
    properties[p.name] = property;
  });

  return { type: "object", properties };
};

/**
 * Converts a JSON Schema document back into authoring-form parameter rows.
 */
export const schemaToParameters = (
  schema?: JsonSchemaObject
): GeneratorParameter[] => {
  if (!schema?.properties) return [];
  return Object.entries(schema.properties).map(([name, property]) => ({
    name,
    type: property.type as ParameterType,
    default: property.default ?? "",
  }));
};
