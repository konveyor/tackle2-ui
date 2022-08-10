import React from "react";
import { Flex, FlexItem, Tooltip } from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import HelpIcon from "@patternfly/react-icons/dist/esm/icons/help-icon";

interface IProps {
  titleText: string;
  tooltipText: string;
}

const TooltipTitle: React.FunctionComponent<IProps> = ({
  titleText,
  tooltipText,
}) => {
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
