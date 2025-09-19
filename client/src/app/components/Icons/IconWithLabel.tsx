import React, { FC, ReactElement, ReactNode } from "react";
import { Flex, FlexItem } from "@patternfly/react-core";

import { OptionalTooltip } from "./OptionalTooltip";

export const IconWithLabel: FC<{
  iconTooltipMessage?: string;
  icon: ReactElement;
  label: ReactNode;
  trailingItem?: ReactElement;
  trailingItemTooltipMessage?: string;
}> = ({
  iconTooltipMessage,
  icon,
  label,
  trailingItem,
  trailingItemTooltipMessage,
}) => (
  <Flex
    flexWrap={{ default: "nowrap" }}
    spaceItems={{ default: "spaceItemsSm" }}
  >
    <FlexItem>
      <OptionalTooltip tooltipMessage={iconTooltipMessage}>
        {icon}
      </OptionalTooltip>
    </FlexItem>
    <FlexItem>{label}</FlexItem>
    {!!trailingItem && (
      <FlexItem>
        <OptionalTooltip tooltipMessage={trailingItemTooltipMessage}>
          {trailingItem}
        </OptionalTooltip>
      </FlexItem>
    )}
  </Flex>
);
