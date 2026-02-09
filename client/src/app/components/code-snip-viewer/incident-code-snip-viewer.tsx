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
import { parseCodeSnip } from "@app/utils/code-snip-utils";
import { LANGUAGES_BY_FILE_EXTENSION } from "config/monacoConstants";

import "./incident-code-snip-viewer.css";

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
  const parsed = React.useMemo(
    () => parseCodeSnip(incident.codeSnip),
    [incident.codeSnip]
  );

  if (!parsed.valid) {
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

  const { startLine, code, lineCount } = parsed;

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
