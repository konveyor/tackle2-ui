import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor/editor";
import "monaco-editor/features/register.all";
import "monaco-editor/languages/definitions/java/register";
import "monaco-editor/languages/definitions/go/register";
import "monaco-editor/languages/definitions/xml/register";
import "monaco-editor/languages/definitions/javascript/register";
import "monaco-editor/languages/definitions/typescript/register";
import "monaco-editor/languages/definitions/html/register";
import "monaco-editor/languages/definitions/css/register";
import "monaco-editor/languages/definitions/yaml/register";
import "monaco-editor/languages/definitions/markdown/register";
import "monaco-editor/languages/definitions/php/register";
import "monaco-editor/languages/definitions/python/register";
import "monaco-editor/languages/definitions/perl/register";
import "monaco-editor/languages/definitions/ruby/register";
import "monaco-editor/languages/definitions/shell/register";
import * as languageFeatures from "monaco-editor/languages/features/register.all";

// Let Rspack bundle workers from Monaco's public ESM entry points.
globalThis.MonacoEnvironment = {
  getWorker(_workerId, label) {
    switch (label) {
      case "json":
        return new Worker(
          new URL(
            "monaco-editor/languages/features/json/json.worker",
            import.meta.url
          )
        );
      case "css":
      case "scss":
      case "less":
        return new Worker(
          new URL(
            "monaco-editor/languages/features/css/css.worker",
            import.meta.url
          )
        );
      case "html":
      case "handlebars":
      case "razor":
        return new Worker(
          new URL(
            "monaco-editor/languages/features/html/html.worker",
            import.meta.url
          )
        );
      case "typescript":
      case "javascript":
        return new Worker(
          new URL(
            "monaco-editor/languages/features/typescript/ts.worker",
            import.meta.url
          )
        );
      default:
        return new Worker(
          new URL("monaco-editor/editor/editor.worker", import.meta.url)
        );
    }
  },
};

// Use the bundled editor and workers instead of loading Monaco from a CDN.
loader.config({ monaco: { ...monaco, ...languageFeatures } });
