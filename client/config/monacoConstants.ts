import type { Language } from "@patternfly/react-code-editor";

// Convert the string enum's values into a union of string literals so the map
// accepts plain language IDs without requiring enum members such as Language.java.
type EditorLanguageId = `${Language}`;

export const LANGUAGES_BY_FILE_EXTENSION = {
  java: "java",
  go: "go",
  xml: "xml",
  js: "javascript",
  ts: "typescript",
  html: "html",
  htm: "html",
  css: "css",
  yaml: "yaml",
  yml: "yaml",
  json: "json",
  md: "markdown",
  php: "php",
  py: "python",
  pl: "perl",
  rb: "ruby",
  sh: "shell",
  bash: "shell",
} as const satisfies Record<string, EditorLanguageId>;
