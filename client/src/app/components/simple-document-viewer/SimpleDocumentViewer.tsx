import * as React from "react";
import { CodeEditor, Language } from "@patternfly/react-code-editor";
import {
  Checkbox,
  EmptyState,
  EmptyStateIcon,
  EmptyStateVariant,
  Spinner,
  Title,
} from "@patternfly/react-core";

import "./SimpleDocumentViewer.css";
import { useFetchTaskByID } from "@app/queries/tasks";
import { RefreshControl } from "./RefreshControl";
import { LanguageToggle } from "./LanguageToggle";

export { Language } from "@patternfly/react-code-editor";

/** The subset of MonacoEditor component functions we want to use. */
type ControlledEditor = {
  focus: () => void;
  setPosition: (position: object) => void;
};

export interface ISimpleDocumentViewerProps {
  /** The id of the document to display, or `undefined` to display the empty state. */
  documentId: number | undefined;

  /** Filename, without extension, to use with the download file action. */
  downloadFilename?: string;

  /**
   * Initial language of the document.  Also used for the file extensions with
   * the download file action.  Defaults to `Language.yaml`.
   */
  language?: Language.yaml | Language.json;

  /**
   * Height of the document viewer, or `"full"` to take up all of the available
   * vertical space.  Defaults to "450px".
   */
  height?: string | "full";
}

/**
 * Fetch and then use the `@patternfly/react-code-editor` to display a document in
 * read-only mode with language highlighting applied.
 */
export const SimpleDocumentViewer = ({
  documentId,
  downloadFilename,
  language = Language.yaml,
  height = "450px",
}: ISimpleDocumentViewerProps) => {
  const editorRef = React.useRef<ControlledEditor>();
  const [currentLanguage, setCurrentLanguage] = React.useState(language);
  const [code, setCode] = React.useState<string>();
  const [merged, setMerged] = React.useState(false);

  const { task, isFetching, fetchError, refetch } = useFetchTaskByID(
    documentId,
    currentLanguage === Language.yaml ? "yaml" : "json",
    merged
  );

  const onMergedChange = (checked: boolean) => {
    setMerged(checked);
    refetch();
  };

  React.useEffect(() => {
    if (task) {
      const formattedCode =
        currentLanguage === Language.yaml
          ? task.toString()
          : JSON.stringify(task, undefined, 2);

      setCode(formattedCode);
      focusAndHomePosition();
    }
  }, [task, currentLanguage]);

  const focusAndHomePosition = () => {
    if (editorRef.current) {
      editorRef.current.focus();
      editorRef.current.setPosition({ column: 0, lineNumber: 1 });
    }
  };

  return (
    <CodeEditor
      className="simple-task-viewer-code"
      isCopyEnabled
      isDarkTheme
      isDownloadEnabled
      isLineNumbersVisible
      isReadOnly
      height={height === "full" ? "100%" : height}
      downloadFileName={downloadFilename}
      language={currentLanguage}
      code={code}
      onEditorDidMount={(editor) => {
        editorRef.current = editor as ControlledEditor;
      }}
      showEditor={code !== undefined}
      emptyState={
        <div className="simple-task-viewer-empty-state">
          <EmptyState
            variant={EmptyStateVariant.sm}
            isFullHeight
            style={{ height: height === "full" ? "auto" : height }}
          >
            <EmptyStateIcon icon={Spinner} />
            <Title size="lg" headingLevel="h4">
              Loading {currentLanguage}
            </Title>
          </EmptyState>
        </div>
      }
      customControls={[
        <RefreshControl
          key="refresh"
          isVisible={code !== ""}
          refetch={refetch}
        />,
        <Checkbox
          className="merged-checkbox"
          key="merged"
          id="merged"
          label="Merged"
          isChecked={merged}
          onChange={(e, checked) => onMergedChange(checked)}
          aria-label="Merged Checkbox"
        />,
        <LanguageToggle
          key="languageToggle"
          code={code}
          currentLanguage={currentLanguage}
          setCurrentLanguage={setCurrentLanguage}
        />,
      ]}
    />
  );
};
