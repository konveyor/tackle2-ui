// This file exports the platform coordinates JSON schema and a sample document
// for easy integration with components. You can import these in your component
// and later replace with backend data as needed.

import { JsonSchemaObject } from "@app/api/models";

const platformCoordinatesSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "Person",
  type: "object",
  properties: {
    age: {
      type: "integer",
      minimum: 0,
    },
    name: {
      type: "string",
    },
    phone: {
      type: "object",
      properties: {
        npa: {
          type: "string",
          description: "3-digit area code",
          pattern: "^\\d{3}$",
        },
        nxx: {
          type: "string",
          description: "3-digit exchange code",
          pattern: "^\\d{3}$",
        },
        number: {
          type: "string",
          description: "4-digit line number",
          pattern: "^\\d{4}$",
        },
      },
      required: ["npa", "nxx", "number"],
    },
  },
  required: ["name", "age", "phone"],
};

const platformCoordinatesDocument = {
  name: "John Doe",
  age: 30,
  phone: {
    npa: "123",
    nxx: "456",
    number: "7890",
  },
};

export const usePlatformCoordinatesProvider = () => {
  return {
    schema: platformCoordinatesSchema as JsonSchemaObject,
    document: platformCoordinatesDocument,
  };
};
