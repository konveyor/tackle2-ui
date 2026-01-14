import { useEffect, useMemo, useRef, useState } from "react";
import { CodeEditor, Language } from "@patternfly/react-code-editor";
import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateVariant,
  Spinner,
  Title,
} from "@patternfly/react-core";

import { JsonSchemaObject } from "@app/api/models";

import { jsonSchemaToYupSchema } from "./utils";

export { Language } from "@patternfly/react-code-editor";

type ControlledEditor = {
  focus: () => void;
  getPosition: () => object;
  setPosition: (position: object) => void;
  getValue: () => string;
};

export interface ISchemaAsCodeEditorProps {
  id: string;
  jsonDocument: object;
  jsonSchema?: JsonSchemaObject;
  onDocumentChanged?: (newSchemaContent: object) => void;
  isReadOnly?: boolean;
  /**
   * Height of the editor. Defaults to 600px. Use "sizeToFit" to size editor to fit content.
   * Set to "100%" to make the editor take up the full height of its container.
   */
  height?: string;
}

export const SchemaAsCodeEditor = ({
  id,
  jsonDocument,
  jsonSchema,
  onDocumentChanged,
  isReadOnly = false,
  height = "600px",
}: ISchemaAsCodeEditorProps) => {
  const editorRef = useRef<ControlledEditor>();

  const [currentCode, setCurrentCode] = useState(
    JSON.stringify(jsonDocument, null, 2)
  );
  // const [documentIsValid, setDocumentIsValid] = React.useState(true);

  const focusMovedOnSelectedDocumentChange = useRef<boolean>(false);
  useEffect(() => {
    if (currentCode && !focusMovedOnSelectedDocumentChange.current) {
      focusAndHomePosition();
      focusMovedOnSelectedDocumentChange.current = true;
    }
  }, [currentCode]);

  const focusAndHomePosition = () => {
    if (editorRef.current) {
      editorRef.current.focus();
      editorRef.current.setPosition({ column: 1, lineNumber: 1 });
    }
  };

  const validator = useMemo(() => {
    return !jsonSchema ? undefined : jsonSchemaToYupSchema(jsonSchema);
  }, [jsonSchema]);

  const handleCodeChange = (newValue: string) => {
    setCurrentCode(newValue);
    if (onDocumentChanged) {
      try {
        const asJson = JSON.parse(newValue);
        if (!validator || validator.isValidSync(asJson)) {
          onDocumentChanged(asJson);
        }
      } catch (error) {
        // ignore invalid JSON, the change will be ignored
      }
    }
  };

  return (
    <CodeEditor
      id={id}
      className="schema-defined-field-viewer-code-editor"
      isCopyEnabled
      isDarkTheme
      isDownloadEnabled
      isLineNumbersVisible
      isReadOnly={isReadOnly}
      height={height}
      downloadFileName="my-schema-download"
      language={Language.json}
      code={currentCode}
      onChange={handleCodeChange}
      onEditorDidMount={(editor, monaco) => {
        editorRef.current = editor as ControlledEditor;
        if (jsonSchema) {
          monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
            validate: true,
            schemaValidation: "error",
            schemas: [
              {
                uri: "http://konveyor.io/dynamic",
                fileMatch: ["*"],
                schema: jsonSchema,
              },
            ],
          });
        }
      }}
      // editorProps={{
      //   onValidate: (markers) => {
      //     setDocumentIsValid(
      //       markers.every(({ severity }) => severity !== MarkerSeverity.Error)
      //     );
      //   },
      // }}
      showEditor={!!currentCode}
      emptyState={
        <div className="simple-task-viewer-empty-state">
          <EmptyState variant={EmptyStateVariant.sm} isFullHeight>
            <EmptyStateIcon icon={Spinner} />
            <Title size="lg" headingLevel="h4">
              Loading Document
            </Title>
          </EmptyState>
        </div>
      }
    />
  );
};
