import React, { FC, ReactElement, ReactNode } from "react";
import { Flex, FlexItem } from "@patternfly/react-core";
import { IconWithOptionalTooltip } from "./IconWithOptionalTooltip";

export const IconWithLabel: FC<{
  iconTooltipMessage?: string;
  icon: ReactElement;
  label: ReactNode;
  hasTrailingItem?: boolean;
  trailingItem?: ReactElement;
}> = ({ iconTooltipMessage, icon, label, hasTrailingItem, trailingItem }) => (
  <Flex
    flexWrap={{ default: "nowrap" }}
    spaceItems={{ default: "spaceItemsSm" }}
  >
    <FlexItem>
      <IconWithOptionalTooltip tooltipMessage={iconTooltipMessage}>
        {icon}
      </IconWithOptionalTooltip>
    </FlexItem>
    <FlexItem>{label}</FlexItem>
    {hasTrailingItem && <FlexItem>{trailingItem}</FlexItem>}
  </Flex>
);
