import * as React from "react";
import { SchemaAsCodeEditor } from "./SchemaAsCodeEditor";
import { Switch } from "@patternfly/react-core";
import { SchemaAsFields } from "./SchemaAsFields";
import { JsonSchemaObject } from "@app/api/models";

export { Language } from "@patternfly/react-code-editor";
export interface ISchemaDefinedFieldProps {
  baseJsonDocument: object;
  jsonSchema?: JsonSchemaObject;
}

export const SchemaDefinedField = ({
  baseJsonDocument,
  jsonSchema,
}: ISchemaDefinedFieldProps) => {
  const [isJsonView, setIsJsonView] = React.useState<boolean>(false);
  const [jsonDocument, setJsonDocument] =
    React.useState<object>(baseJsonDocument);

  const isComplexSchema = (schema: JsonSchemaObject): boolean => {
    let isComplex = false;
    for (const key in schema.properties) {
      const prop = schema.properties[key];
      if (prop.type === "array") {
        return true;
      }
      if (prop.type === "object") {
        isComplex = isComplexSchema(prop);
      }
    }
    return isComplex;
  };

  return (
    <>
      <Switch
        id="json-toggle"
        label="JSON"
        isChecked={isJsonView}
        onChange={() => setIsJsonView(!isJsonView)}
        isDisabled={!jsonSchema || isComplexSchema(jsonSchema)}
      />
      {isJsonView || !jsonSchema ? (
        <SchemaAsCodeEditor
          jsonDocument={jsonDocument}
          onDocumentSaved={(newJsonDocument) =>
            setJsonDocument(newJsonDocument)
          }
        />
      ) : (
        <SchemaAsFields
          jsonDocument={jsonDocument}
          jsonSchema={jsonSchema}
          onDocumentSaved={(newJsonDocument) =>
            setJsonDocument(newJsonDocument)
          }
        />
      )}
    </>
  );
};
