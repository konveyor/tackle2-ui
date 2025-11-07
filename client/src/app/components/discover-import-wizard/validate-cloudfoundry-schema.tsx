import { JsonSchemaObject } from "@app/api/models";
import { validatorGenerator } from "@app/utils/json-schema";

/**
 * The schema that is implemented by `FilterInputCloudFoundry`.
 */
const SUPPORTED_SCHEMA: JsonSchemaObject = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  properties: {
    organizations: {
      description: "Organization names.",
      items: {
        minLength: 1,
        type: "string",
      },
      type: "array",
    },
    spaces: {
      description: "Space names.",
      items: {
        minLength: 1,
        type: "string",
      },
      type: "array",
    },
    names: {
      description: "Application names. Each may be a glob expression.",
      items: {
        minLength: 1,
        type: "string",
      },
      type: "array",
    },
  },
  type: "object",
};

/**
 * Check the given schema and return if it is functionally equivalent to the schema used
 * to build CloudFoundry forms.
 */
export const validateCloudFoundrySchema = validatorGenerator(SUPPORTED_SCHEMA);
