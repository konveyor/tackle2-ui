import * as React from "react";
import { useTranslation } from "react-i18next";
import { CodeEditor, Language } from "@patternfly/react-code-editor";
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateVariant,
} from "@patternfly/react-core";
import { CubesIcon } from "@patternfly/react-icons";

import { AnalysisIncident } from "@app/api/models";
import { LANGUAGES_BY_FILE_EXTENSION } from "config/monacoConstants";

import "./incident-code-snip-viewer.css";

// Pattern: leading whitespace, line number, optional 2-space separator, code content
const codeLineRegex = /^\s*([0-9]+)( {2})?(.*)$/;

/** Parse the codeSnip to extract the starting line number and the code content. */
const parseCodeSnip = (
  codeSnip?: string | null
): { valid: boolean; startLine: number; code: string; lineCount: number } => {
  if (!codeSnip?.trim()) {
    return { valid: false, startLine: 0, code: "", lineCount: 0 };
  }

  const numberedLines = codeSnip.split("\n");
  const codeLines: string[] = [];
  let startLine = 1;
  let startLineFound = false;

  for (const numberedLine of numberedLines) {
    const match = numberedLine.match(codeLineRegex);
    if (match) {
      const lineNum = Number(match[1]);
      if (!startLineFound && !isNaN(lineNum)) {
        startLine = lineNum;
        startLineFound = true;
      }
      // match[3] is the code content after the line number and optional separator
      codeLines.push(match[3] ?? "");
    }
    // Lines without line numbers (e.g., empty string from leading \n) are skipped
    // as they are format artifacts, not actual source lines.
    // Blank source lines like " 6  " still match because they have a line number.
  }

  return {
    valid: true,
    startLine,
    code: codeLines.join("\n"),
    lineCount: codeLines.length,
  };
};

export interface IIncidentCodeSnipViewerProps {
  /** The title/message to display in the error marker tooltip */
  markerMessage: string;
  incident: AnalysisIncident;
}

export const IncidentCodeSnipViewer: React.FC<IIncidentCodeSnipViewerProps> = ({
  markerMessage,
  incident,
}) => {
  const { t } = useTranslation();
  const { valid, startLine, code, lineCount } = React.useMemo(
    () => parseCodeSnip(incident.codeSnip),
    [incident.codeSnip]
  );

  if (!valid) {
    return (
      <EmptyState variant={EmptyStateVariant.sm}>
        <EmptyStateHeader
          titleText={t("message.noCodesSnippetAvailableTitle")}
          headingLevel="h4"
          icon={<EmptyStateIcon icon={CubesIcon} />}
        />
        <EmptyStateBody>
          {t("message.noCodesSnippetAvailableBody")}
        </EmptyStateBody>
      </EmptyState>
    );
  }

  // Convert absolute file line numbers to/from relative editor line numbers
  const toRelativeLine = (absoluteLine: number) => absoluteLine - startLine + 1;
  const toAbsoluteLine = (relativeLine: number) => relativeLine + startLine - 1;

  const extension = incident.file.toLowerCase().split(".").slice(-1)[0];
  const language = Object.keys(LANGUAGES_BY_FILE_EXTENSION).includes(extension)
    ? (LANGUAGES_BY_FILE_EXTENSION[
        extension as keyof typeof LANGUAGES_BY_FILE_EXTENSION
      ] as Language)
    : undefined;

  // Check if the incident line is within the snippet bounds
  const relativeIncidentLine = toRelativeLine(incident.line);
  const isLineInBounds =
    relativeIncidentLine >= 1 && relativeIncidentLine <= lineCount;

  return (
    <CodeEditor
      isReadOnly
      isDarkTheme
      isLineNumbersVisible
      height="450px"
      code={code}
      language={language}
      options={{
        renderValidationDecorations: "on",
        lineNumbers: (lineNumber: number) => String(toAbsoluteLine(lineNumber)),
      }}
      onEditorDidMount={(editor, monaco) => {
        if (!isLineInBounds) {
          editor.layout();
          return;
        }

        try {
          const model = editor.getModel();
          if (model) {
            // Get column positions for the marker. These methods return 0 for
            // empty or whitespace-only lines, but Monaco columns are 1-based.
            const firstNonWsCol =
              model.getLineFirstNonWhitespaceColumn(relativeIncidentLine);
            const lastNonWsCol =
              model.getLineLastNonWhitespaceColumn(relativeIncidentLine);

            // For empty/whitespace lines, use column 1 and end of line
            const startColumn = firstNonWsCol || 1;
            const endColumn =
              lastNonWsCol || model.getLineMaxColumn(relativeIncidentLine);

            // Red squiggly under the affected line
            monaco.editor.setModelMarkers(model, "incident-markers", [
              {
                message: markerMessage,
                severity: monaco.MarkerSeverity.Error,
                startLineNumber: relativeIncidentLine,
                startColumn,
                endLineNumber: relativeIncidentLine,
                endColumn,
              },
            ]);

            // Red exclamation icon in the gutter next to the affected line
            editor.createDecorationsCollection([
              {
                range: new monaco.Range(
                  relativeIncidentLine,
                  1,
                  relativeIncidentLine,
                  1
                ),
                options: {
                  isWholeLine: true,
                  linesDecorationsClassName: "incident-line-error",
                },
              },
            ]);
          }
        } catch (error) {
          console.warn(
            "Failed to render error marking in code snip viewer:",
            error
          );
        }
        editor.layout();
      }}
    />
  );
};
