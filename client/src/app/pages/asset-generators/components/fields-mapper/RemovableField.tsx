import React from "react";
import {
  Button,
  ButtonVariant,
  Tooltip,
  TooltipProps,
} from "@patternfly/react-core";
import { MinusCircleIcon } from "@patternfly/react-icons/dist/js/icons/minus-circle-icon";
import "./RemovableField.css";
import UiIcon from "../UiIcon";

interface RemovableFieldProps {
  onRemove: VoidFunction;
  hideRemoveButton?: boolean;
  removeButtonDataTestId?: string;
}

const REMOVE_BUTTON_EXIT_DELAY = 1500;

const RemovableField: React.FC<
  RemovableFieldProps & Omit<TooltipProps, "content">
> = ({
  onRemove,
  hideRemoveButton = true,
  children,
  removeButtonDataTestId,
  ...props
}) => {
  return (
    <Tooltip
      hidden={hideRemoveButton}
      exitDelay={REMOVE_BUTTON_EXIT_DELAY}
      flipBehavior={["right", "bottom"]}
      position="right-start"
      distance={0}
      content={
        <Button
          variant={ButtonVariant.plain}
          onClick={onRemove}
          data-testid={removeButtonDataTestId}
        >
          <UiIcon size="sm" icon={<MinusCircleIcon />} />
        </Button>
      }
      className="ai-remove-button__tooltip"
      {...props}
    >
      {children}
    </Tooltip>
  );
};

export default RemovableField;
