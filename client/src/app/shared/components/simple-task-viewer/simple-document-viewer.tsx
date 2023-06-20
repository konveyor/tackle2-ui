import * as React from "react";
import {
  CodeEditor,
  CodeEditorControl,
  Language,
} from "@patternfly/react-code-editor";
import {
  Button,
  EmptyState,
  EmptyStateIcon,
  EmptyStateVariant,
  Modal,
  ModalProps,
  Spinner,
  Title,
  ToggleGroup,
  ToggleGroupItem,
} from "@patternfly/react-core";
import { css } from "@patternfly/react-styles";
import editorStyles from "@patternfly/react-styles/css/components/CodeEditor/code-editor";
import CodeIcon from "@patternfly/react-icons/dist/esm/icons/code-icon";
import UndoIcon from "@patternfly/react-icons/dist/esm/icons/undo-icon";

import "./viewer.css";

export { Language } from "@patternfly/react-code-editor";

interface FetchFunction<FetchType> {
  /** Fetch a yaml document for the given document */
  (documentId: number, format: Language.yaml): Promise<string>;

  /** Fetch a JSON document as a `FetchType` object for the given document */
  (documentId: number, format: Language.json): Promise<FetchType>;
}

/** The subset of MonacoEditor component functions we want to use. */
type ControlledEditor = {
  focus: () => void;
  setPosition: (position: object) => void;
};

export interface ISimpleDocumentViewerProps<FetchType> {
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

  /** Function that will fetch the document to display. */
  fetch: FetchFunction<FetchType>;
}

/**
 * Fetch and then use the `@patternfly/react-code-editor` to display a document in
 * read-only mode with language highlighting applied.
 */
export const SimpleDocumentViewer = <FetchType,>({
  documentId,
  downloadFilename,
  language = Language.yaml,
  height = "450px",
  fetch,
}: ISimpleDocumentViewerProps<FetchType>) => {
  const editorRef = React.useRef<ControlledEditor>();

  const [code, setCode] = React.useState<string | undefined>(undefined);
  const [currentLanguage, setCurrentLanguage] = React.useState(language);

  React.useEffect(() => {
    setCode(undefined);
    documentId && fetchDocument(documentId);
  }, [documentId, currentLanguage]);

  const fetchDocument = (documentId: number) => {
    if (currentLanguage === Language.yaml) {
      fetch(documentId, currentLanguage).then((yaml) => {
        setCode(yaml.toString());
        focusAndHomePosition();
      });
    } else {
      fetch(documentId, currentLanguage).then((json) => {
        setCode(JSON.stringify(json, undefined, 2));
        focusAndHomePosition();
      });
    }
  };

  const focusAndHomePosition = () => {
    if (editorRef.current) {
      editorRef.current.focus();
      editorRef.current.setPosition({ column: 0, lineNumber: 1 });
    }
  };
  const refreshControl = (
    <CodeEditorControl
      icon={<UndoIcon />}
      aria-label="refresh-task"
      tooltipProps={{ content: "Refresh" }}
      onClick={() => {
        documentId && fetchDocument(documentId);
      }}
      isVisible={code !== ""}
    />
  );

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
        refreshControl,
        <div
          className={css(
            editorStyles.codeEditorTab,
            "language-toggle-group-container"
          )}
          key="code-language-toggle"
        >
          <ToggleGroup
            aria-label="code content type selection"
            className="language-toggle-group"
          >
            <ToggleGroupItem
              text={
                <>
                  <span className={editorStyles.codeEditorTabIcon}>
                    <CodeIcon />
                  </span>
                  <span className={editorStyles.codeEditorTabText}>JSON</span>
                </>
              }
              buttonId="code-language-select-json"
              isSelected={currentLanguage === "json"}
              isDisabled={!code && currentLanguage !== "json"}
              onChange={() => setCurrentLanguage(Language.json)}
            />
            <ToggleGroupItem
              text={
                <>
                  <span className={editorStyles.codeEditorTabIcon}>
                    <CodeIcon />
                  </span>
                  <span className={editorStyles.codeEditorTabText}>YAML</span>
                </>
              }
              buttonId="code-language-select-yaml"
              isSelected={currentLanguage === "yaml"}
              isDisabled={!code && currentLanguage !== "yaml"}
              onChange={() => setCurrentLanguage(Language.yaml)}
            />
          </ToggleGroup>
        </div>,
      ]}
    />
  );
};

export interface ISimpleDocumentViewerModalProps<FetchType>
  extends ISimpleDocumentViewerProps<FetchType> {
  /** Simple text content of the modal header. */
  title?: string;

  /** A callback for when the close button is clicked. */
  onClose?: ModalProps["onClose"];

  /**
   * Position of the modal, `"top"` aligned or `"normal"`/centered on the view.
   * Defaults to `top`.
   */
  position?: "top" | "normal";

  /**
   * Flag indicating if the modal should be displayed as tall as possible.
   * Defaults to `true`.
   */
  isFullHeight?: boolean;
}

/**
 * Inside of a Modal window, fetch and then use the `SimpleDocumentViewer` to display
 * a document in read-only mode with language highlighting applied.  The modal will be
 * displayed if the `documentId` is set.  If `documentId` is `undefined`, the modal is
 * closed.
 */
export const SimpleDocumentViewerModal = <FetchType,>({
  title,
  documentId,
  onClose,
  position = "top",
  isFullHeight = true,
  ...rest
}: ISimpleDocumentViewerModalProps<FetchType>) => {
  const isOpen = documentId !== undefined;

  return (
    <Modal
      className={css(
        "simple-task-viewer",
        isFullHeight && position === "top" && "full-height-top",
        isFullHeight && position !== "top" && "full-height"
      )}
      isOpen={isOpen}
      onClose={onClose}
      variant="large"
      position={position === "top" ? "top" : undefined}
      title={title ?? `Analysis details for task instance ${documentId}`}
      actions={[
        <Button key="close" variant="link" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      <SimpleDocumentViewer<FetchType>
        documentId={documentId}
        height={isFullHeight ? "full" : undefined}
        {...rest}
      />
    </Modal>
  );
};
