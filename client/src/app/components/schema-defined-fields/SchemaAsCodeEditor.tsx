import * as React from "react";
import { CodeEditor, Language } from "@patternfly/react-code-editor";
import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateVariant,
  Spinner,
  Title,
} from "@patternfly/react-core";
import { SaveControl } from "./SaveControl";
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
}

export const SchemaAsCodeEditor = ({
  id,
  jsonDocument,
  jsonSchema,
  onDocumentSaved,
  onDocumentChanged,
  isReadOnly = false,
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

  const handleSave = () => {
    if (editorRef.current && okToSave && onDocumentSaved) {
      try {
        const asJson = JSON.parse(editorRef.current.getValue());
        if (!validator || validator.isValidSync(asJson)) {
          onDocumentSaved(asJson);
        }
      } catch (error) {
        console.error("Invalid JSON:", error);
        // TODO: Use useNotify() to toast the save error to the user
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
      height="600px"
      downloadFileName="my-schema-download.json"
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
      customControls={[
        !isReadOnly && (
          <SaveControl
            key="save-json"
            onSave={handleSave}
            isDisabled={!okToSave}
          />
        ),
      ].filter(Boolean)}
    />
  );
};
