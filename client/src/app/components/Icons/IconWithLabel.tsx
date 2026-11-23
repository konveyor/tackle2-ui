import { FC, ReactElement, ReactNode } from "react";
import { Flex, FlexItem } from "@patternfly/react-core";

import { OptionalTooltip } from "./OptionalTooltip";

/**
 * Lays an icon out beside a label, with optional tooltips and a trailing item.
 *
 * The row is `nowrap`, so an overlong `label` overflows its cell. How to handle
 * that is the caller's choice -- wrap the label in a `Truncate`, or let it wrap
 * with `pf-v6-u-text-wrap` -- since the right strategy differs per column.
 */
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
