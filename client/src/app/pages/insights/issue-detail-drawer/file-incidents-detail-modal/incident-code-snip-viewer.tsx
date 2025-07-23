import * as React from "react";
import { CodeEditor, Language } from "@patternfly/react-code-editor";
import { AnalysisIncident } from "@app/api/models";

import "./incident-code-snip-viewer.css";
import { LANGUAGES_BY_FILE_EXTENSION } from "config/monacoConstants";
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateVariant,
} from "@patternfly/react-core";
import { CubesIcon } from "@patternfly/react-icons";
import { useTranslation } from "react-i18next";

const codeLineRegex = /^\s*([0-9]+)( {2})?(.*)$/; // Pattern: leading whitespace (line number) (2 spaces)? (code)

export interface IIncidentCodeSnipViewerProps {
  issueTitle: string;
  incident: AnalysisIncident;
}

export const IncidentCodeSnipViewer: React.FC<IIncidentCodeSnipViewerProps> = ({
  issueTitle,
  incident,
}) => {
  const { t } = useTranslation();

  if (!incident?.codeSnip.trim()) {
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
  const codeSnipNumberedLines = incident.codeSnip.split("\n");
  const codeSnipTrimmedLines: string[] = [];
  let codeSnipStartLine = 1;
  codeSnipNumberedLines.forEach((numberedLine, index) => {
    const match = numberedLine.match(codeLineRegex);
    if (match && !isNaN(Number(match[1]))) {
      const lineNum = Number(match[1]);
      if (index === 0) codeSnipStartLine = lineNum;
      const lineCode = match[3] || "";
      codeSnipTrimmedLines.push(lineCode);
    }
  });
  const trimmedCodeSnip = codeSnipTrimmedLines.join("\n");

  const absoluteToRelativeLineNum = (lineNum: number) =>
    lineNum - (codeSnipStartLine - 1);
  const relativeToAbsoluteLineNum = (lineNum: number) =>
    lineNum + (codeSnipStartLine - 1);

  const extension = incident.file.toLowerCase().split(".").slice(-1)[0];
  const language = Object.keys(LANGUAGES_BY_FILE_EXTENSION).includes(extension)
    ? (LANGUAGES_BY_FILE_EXTENSION[
        extension as keyof typeof LANGUAGES_BY_FILE_EXTENSION
      ] as Language)
    : undefined;

  return (
    <CodeEditor
      isReadOnly
      isDarkTheme
      isLineNumbersVisible
      height="450px"
      code={trimmedCodeSnip}
      language={language}
      options={{
        renderValidationDecorations: "on", // See https://github.com/microsoft/monaco-editor/issues/311#issuecomment-578026465
        lineNumbers: (lineNumber: number) =>
          String(relativeToAbsoluteLineNum(lineNumber)),
      }}
      onEditorDidMount={(editor, monaco) => {
        try {
          const model = editor.getModel();
          if (model) {
            const relativeLineNum = absoluteToRelativeLineNum(incident.line);
            // Red squiggly under the affected line
            monaco.editor.setModelMarkers(model, "my-markers", [
              {
                message: issueTitle,
                severity: monaco.MarkerSeverity.Error,
                startLineNumber: relativeLineNum,
                startColumn:
                  model?.getLineFirstNonWhitespaceColumn(relativeLineNum),
                endLineNumber: relativeLineNum,
                endColumn:
                  model?.getLineLastNonWhitespaceColumn(relativeLineNum),
              },
            ]);
            // Red exclamation icon in the gutter next to the affected line
            editor.createDecorationsCollection([
              {
                range: new monaco.Range(relativeLineNum, 1, relativeLineNum, 1),
                options: {
                  isWholeLine: true,
                  linesDecorationsClassName:
                    "incident-line-error fas fa-exclamation-circle",
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
