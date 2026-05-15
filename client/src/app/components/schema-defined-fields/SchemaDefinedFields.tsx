import { useMemo, useState } from "react";
import { Language } from "@patternfly/react-code-editor";
import { Panel, PanelHeader, PanelMain, Switch } from "@patternfly/react-core";

import { JsonSchemaObject } from "@app/api/models";

import { SchemaAsCodeEditor } from "./SchemaAsCodeEditor";
import { SchemaAsFields } from "./SchemaAsFields";
import { isComplexSchema } from "./utils";

export interface ISchemaDefinedFieldProps {
  id?: string;
  className?: string;
  jsonDocument: object;
  jsonSchema?: JsonSchemaObject;
  onDocumentChanged?: (newJsonDocument: object) => void;
  isReadOnly?: boolean;
  /** Language for the editor if the document/schema cannot render as fields. Defaults to Language.json. */
  editorLanguage?: Language.json | Language.yaml;
}

export const SchemaDefinedField = ({
  id = "schema-defined-field",
  className,
  jsonDocument,
  jsonSchema,
  onDocumentChanged,
  isReadOnly = false,
  editorLanguage = Language.json,
}: ISchemaDefinedFieldProps) => {
  const [isJsonView, setIsJsonView] = useState<boolean>(
    !jsonSchema || isComplexSchema(jsonSchema)
  );

  const onChangeHandler = (newJsonDocument: object) => {
    onDocumentChanged?.(newJsonDocument);
  };

  const isComplex = useMemo(() => {
    const isComplex = jsonSchema && isComplexSchema(jsonSchema);
    // console.log("jsonSchema", jsonSchema, "isComplex?", isComplex);
    return isComplex;
  }, [jsonSchema]);

  return (
    <Panel className={className} id={id}>
      {jsonSchema && !isComplex ? (
        <PanelHeader>
          <Switch
            id={`${id}-json-toggle`}
            label={editorLanguage === Language.json ? "JSON" : "YAML"}
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
            onDocumentChanged={onChangeHandler}
            editorLanguage={editorLanguage}
          />
        ) : (
          <SchemaAsFields
            id={`${id}-as-fields`}
            isReadOnly={isReadOnly}
            jsonDocument={jsonDocument}
            jsonSchema={jsonSchema}
            onDocumentChanged={onChangeHandler}
          />
        )}
      </PanelMain>
    </Panel>
  );
};
