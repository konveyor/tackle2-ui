import * as React from "react";
import { CodeEditorControl } from "@patternfly/react-code-editor";
import { UndoIcon } from "@patternfly/react-icons";
import "./SimpleDocumentViewer.css";

export const RefreshControl: React.FC<{
  refetch: () => void;
  isVisible: boolean;
}> = ({ refetch, isVisible }) => (
  <CodeEditorControl
    icon={<UndoIcon />}
    aria-label="refresh-task"
    tooltipProps={{ content: "Refresh" }}
    onClick={refetch}
    isVisible={isVisible}
  />
);
