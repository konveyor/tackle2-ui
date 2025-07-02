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

export { Language } from "@patternfly/react-code-editor";

type ControlledEditor = {
  focus: () => void;
  getPosition: () => object;
  setPosition: (position: object) => void;
  getValue: () => string;
};

export interface ISchemaAsCodeEditorProps {
  jsonDocument: object;
  onDocumentSaved?: (newSchemaContent: object) => void;
}

export const SchemaAsCodeEditor = ({
  onDocumentSaved,
  jsonDocument,
}: ISchemaAsCodeEditorProps) => {
  const editorRef = React.useRef<ControlledEditor>();

  const initialCode = JSON.stringify(jsonDocument, null, 2);

  const [currentCode, setCurrentCode] = React.useState(initialCode);
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

  const handleCodeChange = (newValue: string) => {
    setCurrentCode(newValue);
  };

  const handleSave = () => {
    if (editorRef.current) {
      const contentToSave = editorRef.current.getValue();
      try {
        onDocumentSaved && onDocumentSaved(JSON.parse(contentToSave));
      } catch (error) {
        console.error("Invalid JSON:", error);
      }
    }
  };

  return (
    <CodeEditor
      className="schema-defined-field-viewer-code-editor"
      isCopyEnabled
      isDarkTheme
      isDownloadEnabled
      isLineNumbersVisible
      isReadOnly={onDocumentSaved ? false : true}
      height="600px"
      downloadFileName="my-schema-download.json"
      language={Language.json}
      code={currentCode}
      onChange={handleCodeChange}
      onEditorDidMount={(editor) => {
        editorRef.current = editor as ControlledEditor;
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
        <SaveControl
          key="save-json"
          onSave={handleSave}
          isVisible={okToSave}
        />,
      ]}
    />
  );
};
