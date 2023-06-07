import * as React from "react";
import { CodeEditor, Language } from "@patternfly/react-code-editor";
import { AnalysisAppReport, AnalysisIncident } from "@app/api/models";

import "./issue-incident-code-snip-viewer.css";

export interface IIssueIncidentCodeSnipViewerProps {
  appReport: AnalysisAppReport;
  incident: AnalysisIncident;
}

export const IssueIncidentCodeSnipViewer: React.FC<
  IIssueIncidentCodeSnipViewerProps
> = ({ appReport, incident }) => {
  const relativeLine = 10; // TODO magic number?
  return (
    <CodeEditor
      isReadOnly
      isDarkTheme
      isLineNumbersVisible
      code={incident.codeSnip}
      options={{
        renderValidationDecorations: "on", // See https://github.com/microsoft/monaco-editor/issues/311#issuecomment-578026465
        // TODO figure out magic numbers here and make this accurate - use hub codeSnipStartLine once it exists?
        // lineNumbers: (lineNumber) =>
        //  String(incident.line + lineNumber - 1 - 10), // -1 because lineNumber is 1-indexed, - 10 because codeSnip starts 10 lines early
      }}
      height="450px"
      onEditorDidMount={(editor, monaco) => {
        const model = editor.getModel();
        if (model) {
          monaco.editor.setModelMarkers(model, "my-markers", [
            {
              message: appReport.issue.name,
              severity: monaco.MarkerSeverity.Error,
              startLineNumber: relativeLine,
              startColumn: model?.getLineFirstNonWhitespaceColumn(relativeLine),
              endLineNumber: relativeLine,
              endColumn: model?.getLineLastNonWhitespaceColumn(relativeLine),
            },
          ]);
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
        editor.layout();
      }}
      // language={Language.java} // TODO can we determine the language from the hub?
      // TODO see monaco-editor-webpack-plugin setup info for including only resources for supported languages in the build
    />
  );
};
