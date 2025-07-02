import * as React from "react";
import { CodeEditor, Language } from "@patternfly/react-code-editor";
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
  getPosition: () => object;
  setPosition: (position: object) => void;
  getValue: () => string;
};

export interface ISchemaDefinedFieldProps {
  className?: string;
  jsonDocument: object | string;
  jsonSchema?: object | string;
  onSchemaSaved?: (newSchemaContent: object) => void;
}

export const SchemaDefinedField = ({
  className = "",
  onSchemaSaved,
  jsonDocument,
  jsonSchema,
}: ISchemaDefinedFieldProps) => {
  const editorRef = React.useRef<ControlledEditor>();

  const initialCode = React.useMemo(
    () => JSON.stringify(jsonDocument, null, 2),
    [jsonDocument]
  );
  const [currentCode, setCurrentCode] = React.useState(initialCode);
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
      onSchemaSaved
        ? onSchemaSaved(JSON.parse(contentToSave))
        : console.log("No onSchemaSaved handler provided");
    }
  };

  return (
    <CodeEditor
      className={`schema-defined-field-viewer-code-editor ${className}`}
      isCopyEnabled
      isDarkTheme
      isDownloadEnabled
      isLineNumbersVisible
      isReadOnly={onSchemaSaved ? false : true}
      height="600px"
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
