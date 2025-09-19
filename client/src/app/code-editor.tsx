// import and configure monaco-editor for @patternfly-react/react-code-editor
// See: https://github.com/patternfly/patternfly-react/tree/main/packages/react-code-editor

// Use monaco-editor as a packages to avoid using CDN
import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
loader.config({ monaco });

// TODO: Enable additional YAML syntax highlights?
// https://github.com/patternfly/patternfly-react/blob/main/packages/react-code-editor/README.md#enable-yaml-syntax-highlighting
