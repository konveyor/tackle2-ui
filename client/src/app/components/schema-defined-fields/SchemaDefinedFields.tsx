import * as React from "react";
import { CodeEditor, Language } from "@patternfly/react-code-editor"; // Import CodeEditorControl
import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateVariant,
  Spinner,
  Title,
  Button,
} from "@patternfly/react-core";

export { Language } from "@patternfly/react-code-editor";

type ControlledEditor = {
  focus: () => void;
  getPosition: () => object; // Add getPosition if you need to read cursor position
  setPosition: (position: object) => void;
  getValue: () => string; // Important for getting the current editor content
};

export interface ISchemaDefinedFieldProps {
  // If you wanted to make it dynamic to load other schemas:
  jsonDocument: object | string;
  jsonSchema: object | string;
  onSchemaSaved?: (newSchemaContent: object) => void;
}

export const SchemaDefinedField = ({
  onSchemaSaved = () => {},
  jsonDocument,
  jsonSchema,
}: ISchemaDefinedFieldProps) => {
  const editorRef = React.useRef<ControlledEditor>();

  console.log("SchemaDefinedField rendered with jsonDocument:", jsonDocument);
  const initialCode = React.useMemo(
    () => JSON.stringify(jsonDocument, null, 2),
    [jsonDocument]
  );
  const [currentCode, setCurrentCode] = React.useState(initialCode); // State to hold editable content

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

  const handleCodeChange = (newValue: string) => {
    setCurrentCode(newValue);
  };

  const handleSave = () => {
    if (editorRef.current) {
      const contentToSave = editorRef.current.getValue();
      onSchemaSaved(JSON.parse(contentToSave));
    }
  };

  return (
    <CodeEditor
      className="schema-defined-field-viewer-code-editor"
      isCopyEnabled
      isDarkTheme
      isDownloadEnabled
      isLineNumbersVisible
      isReadOnly={false}
      height="sizeToFit"
      downloadFileName="my-schema-download.json"
      language={Language.json}
      code={currentCode}
      onChange={handleCodeChange}
      onEditorDidMount={(editor) => {
        editorRef.current = editor as ControlledEditor;
      }}
      showEditor={!!currentCode}
      emptyState={
        <div className="simple-task-viewer-empty-state">
          <EmptyState variant={EmptyStateVariant.sm} isFullHeight>
            <EmptyStateIcon icon={Spinner} />
            <Title size="lg" headingLevel="h4">
              Loading Schema
            </Title>
          </EmptyState>
        </div>
      }
      customControls={[
        <Button key="save-json" variant="plain" onClick={handleSave}>
          Save
        </Button>,
      ]}
    />
  );
};
