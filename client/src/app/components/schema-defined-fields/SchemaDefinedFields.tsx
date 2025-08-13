import * as React from "react";
import { Panel, PanelHeader, PanelMain, Switch } from "@patternfly/react-core";
import { JsonSchemaObject } from "@app/api/models";

import { SchemaAsCodeEditor } from "./SchemaAsCodeEditor";
import { SchemaAsFields } from "./SchemaAsFields";
import { isComplexSchema } from "./utils";

export { Language } from "@patternfly/react-code-editor";
export interface ISchemaDefinedFieldProps {
  id?: string;
  className?: string;
  jsonDocument: object;
  jsonSchema?: JsonSchemaObject;
  onDocumentSaved?: (newJsonDocument: object) => void;
  onDocumentChanged?: (newJsonDocument: object) => void;
  isReadOnly?: boolean;
}

export const SchemaDefinedField = ({
  id = "schema-defined-field",
  className,
  jsonDocument,
  jsonSchema,
  onDocumentSaved,
  onDocumentChanged,
  isReadOnly = false,
}: ISchemaDefinedFieldProps) => {
  const [isJsonView, setIsJsonView] = React.useState<boolean>(
    !jsonSchema || isComplexSchema(jsonSchema)
  );

  const onSavedHandler = !onDocumentSaved
    ? undefined
    : (newJsonDocument: object) => {
        onDocumentSaved?.(newJsonDocument);
      };

  const onChangeHandler = (newJsonDocument: object) => {
    onDocumentChanged?.(newJsonDocument);
  };

  const isComplex = React.useMemo(() => {
    const isComplex = jsonSchema && isComplexSchema(jsonSchema);
    console.log("jsonSchema", jsonSchema, "isComplex?", isComplex);
    return isComplex;
  }, [jsonSchema]);

  return (
    <Panel className={className} id={id}>
      {jsonSchema && !isComplex ? (
        <PanelHeader>
          <Switch
            id={`${id}-json-toggle`}
            label="JSON"
            isChecked={isJsonView}
            onChange={() => setIsJsonView(!isJsonView)}
          />
        </PanelHeader>
      ) : null}

      <PanelMain maxHeight="100%">
        {!jsonSchema || isComplex || isJsonView ? (
          <SchemaAsCodeEditor
            id={`${id}-as-code-editor`}
            isReadOnly={isReadOnly}
            jsonDocument={jsonDocument}
            jsonSchema={jsonSchema}
            onDocumentSaved={onSavedHandler}
            onDocumentChanged={onChangeHandler}
          />
        ) : (
          <SchemaAsFields
            id={`${id}-as-fields`}
            isReadOnly={isReadOnly}
            jsonDocument={jsonDocument}
            jsonSchema={jsonSchema}
            onDocumentSaved={onSavedHandler}
            onDocumentChanged={onChangeHandler}
          />
        )}
      </PanelMain>
    </Panel>
  );
};
