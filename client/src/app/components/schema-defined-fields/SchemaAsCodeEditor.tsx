import { useEffect, useMemo, useRef, useState } from "react";
import * as jsYaml from "js-yaml";
import { useTranslation } from "react-i18next";
import { CodeEditor, Language } from "@patternfly/react-code-editor";
import {
  EmptyState,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateVariant,
  Spinner,
} from "@patternfly/react-core";

import { JsonSchemaObject } from "@app/api/models";

import { jsonSchemaToYupSchema } from "./utils";

type ControlledEditor = {
  focus: () => void;
  getPosition: () => object;
  setPosition: (position: object) => void;
  getValue: () => string;
};

export interface ISchemaAsCodeEditorProps {
  id: string;
  jsonDocument: object;
  jsonSchema?: JsonSchemaObject;
  onDocumentChanged?: (newSchemaContent: object) => void;
  isReadOnly?: boolean;
  /**
   * Height of the editor. Defaults to 600px. Use "sizeToFit" to size editor to fit content.
   * Set to "100%" to make the editor take up the full height of its container.
   */
  height?: string;
  /** Language for the editor. Defaults to Language.json. */
  editorLanguage?: Language.json | Language.yaml;
}

const jsonDocumentToCode = (
  jsonDocument: object,
  editorLanguage: Language.json | Language.yaml
) => {
  return editorLanguage === Language.yaml
    ? jsYaml.dump(jsonDocument, { indent: 2 })
    : JSON.stringify(jsonDocument, null, 2);
};

export const SchemaAsCodeEditor = ({
  id,
  jsonDocument,
  jsonSchema,
  onDocumentChanged,
  isReadOnly = false,
  height = "600px",
  editorLanguage = Language.json,
}: ISchemaAsCodeEditorProps) => {
  const { t } = useTranslation();
  const editorRef = useRef<ControlledEditor>();

  const [currentCode, setCurrentCode] = useState(() =>
    jsonDocumentToCode(jsonDocument, editorLanguage)
  );

  useEffect(() => {
    setCurrentCode(jsonDocumentToCode(jsonDocument, editorLanguage));
  }, [jsonDocument, editorLanguage]);

  const focusMovedOnSelectedDocumentChange = useRef<boolean>(false);
  const focusAndHomePosition = () => {
    if (editorRef.current) {
      editorRef.current.focus();
      editorRef.current.setPosition({ column: 1, lineNumber: 1 });
    }
  };

  useEffect(() => {
    if (currentCode && !focusMovedOnSelectedDocumentChange.current) {
      focusAndHomePosition();
      focusMovedOnSelectedDocumentChange.current = true;
    }
  }, [currentCode]);

  const validator = useMemo(() => {
    return !jsonSchema ? undefined : jsonSchemaToYupSchema(jsonSchema);
  }, [jsonSchema]);

  const handleCodeChange = (newValue: string) => {
    setCurrentCode(newValue);
    if (onDocumentChanged) {
      try {
        const parsed =
          editorLanguage === Language.yaml
            ? (jsYaml.load(newValue) as unknown)
            : (JSON.parse(newValue) as unknown);

        if (
          parsed &&
          typeof parsed === "object" &&
          (!validator || validator.isValidSync(parsed))
        ) {
          onDocumentChanged(parsed as object);
        }
      } catch {
        // ignore invalid document, the change will be ignored
      }
    }
  };

  return (
    <CodeEditor
      id={id}
      className="schema-defined-field-viewer-code-editor"
      isCopyEnabled
      isDarkTheme
      isDownloadEnabled
      isLineNumbersVisible
      isReadOnly={isReadOnly}
      height={height}
      downloadFileName="my-schema-download"
      language={editorLanguage}
      code={currentCode}
      options={{
        fontFamily: '"Red Hat Mono", "Courier New", Courier, monospace',
      }}
      onChange={handleCodeChange}
      onEditorDidMount={(editor, monaco) => {
        editorRef.current = editor as ControlledEditor;
        document.fonts?.ready?.then(() => monaco.editor.remeasureFonts());
        if (jsonSchema) {
          monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
            validate: true,
            schemaValidation: "error",
            schemas: [
              {
                uri: "http://konveyor.io/dynamic",
                fileMatch: ["*"],
                schema: jsonSchema,
              },
            ],
          });
        }
      }}
      // editorProps={{
      //   onValidate: (markers) => {
      //     setDocumentIsValid(
      //       markers.every(({ severity }) => severity !== MarkerSeverity.Error)
      //     );
      //   },
      // }}
      showEditor={!!currentCode}
      emptyState={
        <div className="simple-task-viewer-empty-state">
          <EmptyState variant={EmptyStateVariant.sm} isFullHeight>
            <EmptyStateHeader
              titleText={t("message.loadingDocumentTitle")}
              icon={<EmptyStateIcon icon={Spinner} />}
              headingLevel="h4"
            />
          </EmptyState>
        </div>
      }
    />
  );
};
