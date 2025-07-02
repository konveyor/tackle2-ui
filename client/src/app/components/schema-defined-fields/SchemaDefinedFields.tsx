import * as React from "react";
import { SchemaAsCodeEditor } from "./SchemaAsCodeEditor";
import { Panel, PanelHeader, PanelMain, Switch } from "@patternfly/react-core";
import { SchemaAsFields } from "./SchemaAsFields";
import { JsonSchemaObject } from "@app/api/models";
import { isComplexSchema } from "./utils";

export { Language } from "@patternfly/react-code-editor";
export interface ISchemaDefinedFieldProps {
  className?: string;
  baseJsonDocument: object;
  jsonSchema?: JsonSchemaObject;
  onDocumentSaved?: (newJsonDocument: object) => void;
}

export const SchemaDefinedField = ({
  className,
  baseJsonDocument,
  jsonSchema,
  onDocumentSaved,
}: ISchemaDefinedFieldProps) => {
  const [isJsonView, setIsJsonView] = React.useState<boolean>(false);
  const [jsonDocument, setJsonDocument] =
    React.useState<object>(baseJsonDocument);

  return (
    <Panel className={className}>
      <PanelHeader>
        <Switch
          id="json-toggle"
          label="JSON"
          isChecked={isJsonView}
          onChange={() => setIsJsonView(!isJsonView)}
          isDisabled={!jsonSchema || isComplexSchema(jsonSchema)}
        />
      </PanelHeader>
      <PanelMain maxHeight="100%">
        {isJsonView || !jsonSchema ? (
          <SchemaAsCodeEditor
            jsonDocument={jsonDocument}
            onDocumentSaved={(newJsonDocument) => {
              setJsonDocument(newJsonDocument);
              onDocumentSaved && onDocumentSaved(newJsonDocument);
            }}
          />
        ) : (
          <SchemaAsFields
            jsonDocument={jsonDocument}
            jsonSchema={jsonSchema}
            onDocumentSaved={(newJsonDocument) => {
              onDocumentSaved && onDocumentSaved(newJsonDocument);
            }}
            onDocumentChanged={(newJsonDocument) => {
              setJsonDocument(newJsonDocument);
            }}
          />
        )}
      </PanelMain>
    </Panel>
  );
};
