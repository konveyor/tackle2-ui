import * as React from "react";
import { Language } from "@patternfly/react-code-editor";
import { ToggleGroup, ToggleGroupItem } from "@patternfly/react-core";
import { css } from "@patternfly/react-styles";
import editorStyles from "@patternfly/react-styles/css/components/CodeEditor/code-editor";
import CodeIcon from "@patternfly/react-icons/dist/esm/icons/code-icon";
import "./SimpleDocumentViewer.css";

export const LanguageToggle: React.FC<{
  currentLanguage: Language;
  code?: string;
  supportedLanguages: Language[];
  setCurrentLanguage: (lang: Language) => void;
}> = ({ currentLanguage, code, setCurrentLanguage, supportedLanguages }) => {
  if (supportedLanguages.length <= 1) {
    return <></>;
  }

  return (
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
        {supportedLanguages.map((lang) => (
          <ToggleGroupItem
            key={lang}
            text={
              <>
                <span className={editorStyles.codeEditorTabIcon}>
                  <CodeIcon />
                </span>
                <span className={editorStyles.codeEditorTabText}>
                  {lang === Language.plaintext ? "Text" : lang.toUpperCase()}
                </span>
              </>
            }
            buttonId={`code-language-select-${lang}`}
            isSelected={currentLanguage === lang}
            isDisabled={!code && currentLanguage !== lang}
            onChange={() => setCurrentLanguage(lang)}
          />
        ))}
      </ToggleGroup>
    </div>
  );
};
