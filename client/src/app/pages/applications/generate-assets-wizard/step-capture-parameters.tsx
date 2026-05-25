import { JsonDocument, JsonSchemaObject } from "@app/api/models";

export interface ParameterState {
  isValid: boolean;
  parametersRequired: boolean;
  parameters?: JsonDocument;
  schema?: JsonSchemaObject;
}
