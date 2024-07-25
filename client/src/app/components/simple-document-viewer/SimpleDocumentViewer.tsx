import * as React from "react";
import { CodeEditor, Language } from "@patternfly/react-code-editor";
import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateVariant,
  Spinner,
  Title,
} from "@patternfly/react-core";

import "./SimpleDocumentViewer.css";
import {
  useFetchTaskAttachmentById,
  useFetchTaskByIdAndFormat,
} from "@app/queries/tasks";
import { RefreshControl } from "./RefreshControl";
import { LanguageToggle } from "./LanguageToggle";
import { AttachmentToggle } from "./AttachmentToggle";
import { TaskAttachment } from "@app/api/models";

export { Language } from "@patternfly/react-code-editor";

/** The subset of MonacoEditor component functions we want to use. */
type ControlledEditor = {
  focus: () => void;
  setPosition: (position: object) => void;
};

export interface Document {
  id: DocumentId;
  name: string;
  description?: string;
  languages: Language[];
  downloadFilename: string;
}

export interface ISimpleDocumentViewerProps {
  /** The id of the task to display, or `undefined` to display the empty state. */
  taskId: number | undefined;

  /**
   * The document ID to display - number for task attachment ID, string values for
   * other viewing modes.  Defaults to basic task view (LOG_VIEW).
   */
  documentId: DocumentId | undefined;

  /** Task attachments */
  attachments: TaskAttachment[];

  /**
   * Height of the document viewer, or `"full"` to take up all of the available
   * vertical space.  Defaults to "450px".
   */
  height?: string | "full";

  /** Callback triggered when user selects a new document to display */
  onDocumentChange?: (documentId: DocumentId) => void;
}

export type DocumentId = number | "LOG_VIEW" | "MERGED_VIEW";

const useDocuments = ({
  taskId,
  selectedId,
  currentLanguage,
}: {
  taskId?: number;
  selectedId: DocumentId;
  currentLanguage: Language;
}) => {
  const { task, refetch: refetchTask } = useFetchTaskByIdAndFormat({
    taskId,
    format: currentLanguage === Language.yaml ? "yaml" : "json",
    enabled:
      !!taskId && (selectedId === "LOG_VIEW" || selectedId === "MERGED_VIEW"),
    merged: selectedId === "MERGED_VIEW",
  });

  const isAttachment = typeof selectedId === "number";
  const { attachment, refetch: refetchAttachment } = useFetchTaskAttachmentById(
    {
      attachmentId: isAttachment ? selectedId : undefined,
      enabled: isAttachment,
    }
  );

  return isAttachment
    ? { code: attachment, refetch: refetchAttachment }
    : { code: task, refetch: refetchTask };
};

/**
 * Fetch and then use the `@patternfly/react-code-editor` to display a document in
 * read-only mode with language highlighting applied.
 */
export const SimpleDocumentViewer = ({
  taskId,
  documentId = "LOG_VIEW",
  attachments,
  height = "450px",
  onDocumentChange,
}: ISimpleDocumentViewerProps) => {
  const configuredDocuments: Document[] = React.useMemo(
    () => [
      {
        id: "LOG_VIEW",
        name: "Log view",
        languages: [Language.yaml, Language.json],
        downloadFilename: `log-${taskId}`,
      },
      {
        id: "MERGED_VIEW",
        name: "Merged log view",
        description: "with inlined commands output",
        languages: [Language.yaml, Language.json],
        downloadFilename: `log-merged-${taskId}`,
      },
      ...attachments.map(({ id, name = "unknown" }) => ({
        id,
        name,
        languages: [
          (name.endsWith(".yaml") || name.endsWith(".yml")) && Language.yaml,
          name.endsWith(".json") && Language.json,
          Language.plaintext,
        ].filter(Boolean),
        downloadFilename: name.match(/\.(yaml|yml|json)$/)
          ? name.substring(0, name.lastIndexOf("."))
          : name,
      })),
    ],
    [attachments, taskId]
  );

  const [selectedDocument, setSelectedDocument] = React.useState<Document>(
    configuredDocuments.find(({ id }) => id === documentId) ??
      configuredDocuments[0]
  );
  const supportedLanguages = configuredDocuments.find(
    ({ id }) => id === selectedDocument.id
  )?.languages ?? [Language.yaml, Language.json];

  const [currentLanguage, setCurrentLanguage] = React.useState(
    supportedLanguages[0] ?? Language.plaintext
  );

  const editorRef = React.useRef<ControlledEditor>();

  const { code, refetch } = useDocuments({
    taskId,
    currentLanguage,
    selectedId: selectedDocument.id,
  });

  // move focus on first code change AFTER a new document was selected
  const focusMovedOnSelectedDocumentChange = React.useRef<boolean>(false);
  React.useEffect(() => {
    if (code && !focusMovedOnSelectedDocumentChange.current) {
      focusAndHomePosition();
      focusMovedOnSelectedDocumentChange.current = true;
    }
  }, [code]);

  const focusAndHomePosition = () => {
    if (editorRef.current) {
      editorRef.current.focus();
      editorRef.current.setPosition({ column: 0, lineNumber: 1 });
    }
  };

  const onSelect = (docId: string | number) => {
    const doc = configuredDocuments.find(({ id }) => id === docId);
    if (!doc || doc.id === selectedDocument.id) {
      return;
    }

    setCurrentLanguage(doc.languages[0] ?? Language.plaintext);
    setSelectedDocument(doc);
    focusMovedOnSelectedDocumentChange.current = false;
    onDocumentChange?.(doc.id);
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
      downloadFileName={selectedDocument.downloadFilename}
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
        <AttachmentToggle
          key="attachmentToggle"
          documents={configuredDocuments.map((it) => ({
            ...it,
            isSelected: it.id === selectedDocument.id,
          }))}
          onSelect={onSelect}
        />,
        <RefreshControl
          key="refresh"
          isVisible={code !== ""}
          refetch={refetch}
        />,
        <LanguageToggle
          key="languageToggle"
          code={code}
          supportedLanguages={supportedLanguages}
          currentLanguage={currentLanguage}
          setCurrentLanguage={setCurrentLanguage}
        />,
      ]}
    />
  );
};
