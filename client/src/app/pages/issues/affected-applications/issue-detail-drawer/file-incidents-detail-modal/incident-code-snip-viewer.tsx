import * as React from "react";
import { CodeEditor, Language } from "@patternfly/react-code-editor";
import { AnalysisAppReport, AnalysisIncident } from "@app/api/models";

import "./incident-code-snip-viewer.css";

export interface IIncidentCodeSnipViewerProps {
  appReport: AnalysisAppReport;
  incident: AnalysisIncident;
}

export const IncidentCodeSnipViewer: React.FC<IIncidentCodeSnipViewerProps> = ({
  appReport,
  incident,
}) => {
  // TODO once hub includes line numbers in the codeSnip string, we'll need to parse that and strip those numbers out.
  const codeSnipStartLine = 1; // TODO replace this based on parsed line numbers from the codeSnip

  const absoluteToRelativeLineNum = (lineNum: number) =>
    lineNum - (codeSnipStartLine - 1);
  const relativeToAbsoluteLineNum = (lineNum: number) =>
    lineNum + (codeSnipStartLine - 1);

  return (
    <CodeEditor
      isReadOnly
      isDarkTheme
      isLineNumbersVisible
      height="450px"
      code={incident.codeSnip} // TODO replace this with line numbers stripped out
      // language={Language.java} // TODO can we determine the language from the hub?
      // TODO Configure monaco-editor-webpack-plugin to only include resources for supported languages in the build
      //      (See https://github.com/microsoft/monaco-editor/tree/main/webpack-plugin#options)
      options={{
        renderValidationDecorations: "on", // See https://github.com/microsoft/monaco-editor/issues/311#issuecomment-578026465
        lineNumbers: (lineNumber) =>
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
                message: appReport.issue.name,
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
