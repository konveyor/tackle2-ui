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
  isReadOnly?: boolean;
}

export const SchemaDefinedField = ({
  className,
  baseJsonDocument,
  jsonSchema,
  onDocumentSaved,
  isReadOnly = false,
}: ISchemaDefinedFieldProps) => {
  const [isJsonView, setIsJsonView] = React.useState<boolean>(!jsonSchema);
  const [jsonDocument, setJsonDocument] =
    React.useState<object>(baseJsonDocument);

  const onSavedHandler = !onDocumentSaved
    ? undefined
    : (newJsonDocument: object) => {
        setJsonDocument(newJsonDocument);
        onDocumentSaved?.(newJsonDocument);
      };

  return (
    <Panel className={className}>
      {jsonSchema ? (
        <PanelHeader>
          <Switch
            id="json-toggle"
            label="JSON"
            isChecked={isJsonView}
            onChange={() => setIsJsonView(!isJsonView)}
            isDisabled={!jsonSchema || isComplexSchema(jsonSchema)}
          />
        </PanelHeader>
      ) : null}

      <PanelMain maxHeight="100%">
        {isJsonView || !jsonSchema ? (
          <SchemaAsCodeEditor
            isReadOnly={isReadOnly}
            jsonDocument={jsonDocument}
            jsonSchema={jsonSchema}
            onDocumentSaved={onSavedHandler}
          />
        ) : (
          <SchemaAsFields
            isReadOnly={isReadOnly}
            jsonDocument={jsonDocument}
            jsonSchema={jsonSchema}
            onDocumentSaved={onSavedHandler}
            onDocumentChanged={(newJsonDocument: object) => {
              setJsonDocument(newJsonDocument);
            }}
          />
        )}
      </PanelMain>
    </Panel>
  );
};
