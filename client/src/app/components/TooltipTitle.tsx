import * as React from "react";
import { Flex, FlexItem, Tooltip } from "@patternfly/react-core";
import { HelpIcon } from "@patternfly/react-icons";

interface IProps {
  titleText: string;
  tooltipText: string;
}

const TooltipTitle: React.FC<IProps> = ({ titleText, tooltipText }) => {
  return (
    <Flex>
      <FlexItem>{titleText}</FlexItem>
      <FlexItem>
        <Tooltip content={tooltipText} position={"top"}>
          <HelpIcon />
        </Tooltip>
      </FlexItem>
    </Flex>
  );
};

export default TooltipTitle;
