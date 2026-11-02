import { FC, ReactElement, ReactNode } from "react";
import { Flex, FlexItem } from "@patternfly/react-core";
import textStyles from "@patternfly/react-styles/css/utilities/Text/text";

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
    {/*
      The label carries the truncation itself: a `Td modifier="truncate"` sets
      `text-overflow: ellipsis` on the cell, which never reaches text nested in
      this flex container, so a long label would be hard clipped instead.
    */}
    <FlexItem className={textStyles.textTruncate}>{label}</FlexItem>
    {!!trailingItem && (
      <FlexItem>
        <OptionalTooltip tooltipMessage={trailingItemTooltipMessage}>
          {trailingItem}
        </OptionalTooltip>
      </FlexItem>
    )}
  </Flex>
);
