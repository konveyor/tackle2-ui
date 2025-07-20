import * as React from "react";
import { CodeEditorControl } from "@patternfly/react-code-editor";
import { SaveIcon } from "@patternfly/react-icons";

export const SaveControl: React.FC<{
  onSave: () => void;
  isDisabled: boolean;
}> = ({ onSave, isDisabled }) => (
  <CodeEditorControl
    icon={<SaveIcon />}
    aria-label="save-task"
    tooltipProps={{ content: "Save" }}
    onClick={onSave}
    isAriaDisabled={isDisabled}
  />
);
