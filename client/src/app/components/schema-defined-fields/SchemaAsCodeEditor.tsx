import * as React from "react";
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
import { useMemo } from "react";

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
  onDocumentSaved?: (newSchemaContent: object) => void;
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
  onDocumentSaved,
  onDocumentChanged,
  isReadOnly = false,
  height = "600px",
}: ISchemaAsCodeEditorProps) => {
  const editorRef = React.useRef<ControlledEditor>();

  const [currentCode, setCurrentCode] = React.useState(
    JSON.stringify(jsonDocument, null, 2)
  );
  const [okToSave, setOkToSave] = React.useState(true);

  const focusMovedOnSelectedDocumentChange = React.useRef<boolean>(false);
  React.useEffect(() => {
    if (currentCode && !focusMovedOnSelectedDocumentChange.current) {
      focusAndHomePosition();
      focusMovedOnSelectedDocumentChange.current = true;
    }
  }, [currentCode]);

  const focusAndHomePosition = () => {
    if (editorRef.current) {
      editorRef.current.focus();
      editorRef.current.setPosition({ column: 0, lineNumber: 1 });
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
      editorProps={{
        onValidate: (markers) => {
          setOkToSave(markers.every(({ severity }) => severity !== 8));
        },
      }}
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
