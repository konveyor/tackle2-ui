import * as React from "react";
import { Language } from "@patternfly/react-code-editor";
import { ToggleGroup, ToggleGroupItem } from "@patternfly/react-core";
import { css } from "@patternfly/react-styles";
import editorStyles from "@patternfly/react-styles/css/components/CodeEditor/code-editor";
import CodeIcon from "@patternfly/react-icons/dist/esm/icons/code-icon";
import "./SimpleDocumentViewer.css";

export const LanguageToggle: React.FC<{
  currentLanguage: Language.yaml | Language.json;
  code?: string;
  setCurrentLanguage: (lang: Language.yaml | Language.json) => void;
}> = ({ currentLanguage, code, setCurrentLanguage }) => (
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
  </div>
);
