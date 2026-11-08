import { JsonSchemaObject } from "@app/api/models";

/**
 * Helpers for generator parameters: the supported types, conversion between
 * authoring-form rows and JSON Schema, and default-value validation.
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
 * The supported parameter types. `ParameterType` is derived from this list, so
 * adding a type updates the union and the type options; it also needs a
 * `parameterType.<type>` translation, plus any coercion or validation it
 * requires in `coerceDefault` and `defaultValueError`.
 */
export const PARAMETER_TYPES = ["string", "number", "boolean"] as const;

export type ParameterType = (typeof PARAMETER_TYPES)[number];

/**
 * A single generator parameter as edited in the authoring form.
 */
export interface GeneratorParameter {
  name: string;
  type: ParameterType;
  default: string | number | boolean;
  description?: string;
}

const isSet = (value: unknown): boolean =>
  value !== undefined && value !== null && value !== "";

/** Coerce a default value entered in the form to match the parameter type. */
const coerceDefault = (
  value: GeneratorParameter["default"],
  type: ParameterType
): string | number | boolean => {
  if (type === "number") return Number(value);
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
    if (isSet(p.description)) property.description = String(p.description);
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
    description: property.description ?? "",
  }));
};

/**
 * Validates a default value for a parameter. Returns an i18n key describing the
 * problem, or null when the value is valid. A blank value means no default and
 * is valid; a number must be a valid number.
 */
export const defaultValueError = (
  value: string,
  type: ParameterType
): string | null => {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (type === "number") {
    return /^-?\d+(\.\d+)?$/.test(trimmed) ? null : "validation.mustBeNumber";
  }
  return null;
};

/**
 * True when `name` (trimmed) appears more than once in the parameter list.
 * Comparison is case-sensitive to match JSON object-key semantics: duplicate
 * names would collide into one property in parametersToSchema.
 */
export const isDuplicateParameterName = (
  params: { name: string }[],
  name: string
): boolean => {
  const target = name.trim();
  if (target === "") return false;
  return params.filter((p) => (p.name ?? "").trim() === target).length > 1;
};
