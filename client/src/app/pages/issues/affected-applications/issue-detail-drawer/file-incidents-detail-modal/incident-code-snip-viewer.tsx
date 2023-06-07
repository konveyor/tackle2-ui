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
  const relativeLine = 10; // TODO magic number?
  return (
    <CodeEditor
      isReadOnly
      isDarkTheme
      isLineNumbersVisible
      height="450px"
      code={incident.codeSnip}
      // language={Language.java} // TODO can we determine the language from the hub?
      // TODO see monaco-editor-webpack-plugin setup info for including only resources for supported languages in the build
      options={{
        renderValidationDecorations: "on", // See https://github.com/microsoft/monaco-editor/issues/311#issuecomment-578026465
        // TODO figure out magic numbers here and make this accurate - use hub codeSnipStartLine once it exists?
        // lineNumbers: (lineNumber) =>
        //  String(incident.line + lineNumber - 1 - 10), // -1 because lineNumber is 1-indexed, - 10 because codeSnip starts 10 lines early
      }}
      onEditorDidMount={(editor, monaco) => {
        try {
          const model = editor.getModel();
          if (model) {
            // Red squiggly under the affected line
            monaco.editor.setModelMarkers(model, "my-markers", [
              {
                message: appReport.issue.name,
                severity: monaco.MarkerSeverity.Error,
                startLineNumber: relativeLine,
                startColumn:
                  model?.getLineFirstNonWhitespaceColumn(relativeLine),
                endLineNumber: relativeLine,
                endColumn: model?.getLineLastNonWhitespaceColumn(relativeLine),
              },
            ]);
            // Red exclamation icon in the gutter next to the affected line
            editor.createDecorationsCollection([
              {
                range: new monaco.Range(relativeLine, 1, relativeLine, 1),
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
