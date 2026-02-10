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

  // Convert codeSnip line numbers (starting at codeSnip first line number) to/from editor line numbers (start at 1)
  const toSnipLine = (absoluteLine: number) => absoluteLine - startLine + 1;
  const toEditorLine = (relativeLine: number) => relativeLine + startLine - 1;

  const extension = incident.file.toLowerCase().split(".").slice(-1)[0];
  const language = Object.keys(LANGUAGES_BY_FILE_EXTENSION).includes(extension)
    ? (LANGUAGES_BY_FILE_EXTENSION[
        extension as keyof typeof LANGUAGES_BY_FILE_EXTENSION
      ] as Language)
    : undefined;

  // Check if the incident line is within the snippet bounds
  const snipIncidentLine = toSnipLine(incident.line);
  const isIncidentLineVisible =
    snipIncidentLine >= 1 && snipIncidentLine <= lineCount;

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
        lineNumbers: (lineNumber: number) => String(toEditorLine(lineNumber)),
      }}
      onEditorDidMount={(editor, monaco) => {
        if (!isIncidentLineVisible) {
          return;
        }

        try {
          const model = editor.getModel();
          if (model) {
            // Determine the column positions for the marker. Monaco columns are 1-based.
            // For empty/whitespace lines, use column 1 and end of line
            const startColumn =
              model.getLineFirstNonWhitespaceColumn(snipIncidentLine) || 1;
            const endColumn =
              model.getLineLastNonWhitespaceColumn(snipIncidentLine) ||
              model.getLineMaxColumn(snipIncidentLine);

            // Red squiggly under the affected line
            monaco.editor.setModelMarkers(model, "incident-markers", [
              {
                message: markerMessage,
                severity: monaco.MarkerSeverity.Error,
                startLineNumber: snipIncidentLine,
                startColumn,
                endLineNumber: snipIncidentLine,
                endColumn,
              },
            ]);

            // Red exclamation icon in the gutter next to the affected line
            editor.createDecorationsCollection([
              {
                range: new monaco.Range(
                  snipIncidentLine,
                  1,
                  snipIncidentLine,
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

        editor.layout(); // Layout the editor to ensure the markers are visible
      }}
    />
  );
};
