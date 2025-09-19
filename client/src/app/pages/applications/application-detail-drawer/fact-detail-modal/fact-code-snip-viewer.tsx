import * as React from "react";
import yaml from "js-yaml";
import { CodeEditor, Language } from "@patternfly/react-code-editor";

import { Fact } from "@app/api/models";
export interface IFactCodeSnipViewerProps {
  fact: Fact;
}

export const FactCodeSnipViewer: React.FC<IFactCodeSnipViewerProps> = ({
  fact,
}) => {
  return (
    <CodeEditor
      isReadOnly
      isDarkTheme
      isLineNumbersVisible
      language={Language.json}
      height="450px"
      code={yaml.dump(fact.data, { skipInvalid: true })}
    />
  );
};
