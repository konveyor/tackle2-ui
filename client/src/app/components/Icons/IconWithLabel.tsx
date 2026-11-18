import { FC, ReactElement, ReactNode } from "react";
import { Flex, FlexItem, Truncate } from "@patternfly/react-core";

import { OptionalTooltip } from "./OptionalTooltip";

export const IconWithLabel: FC<{
  iconTooltipMessage?: string;
  icon: ReactElement;
  label: ReactNode;
  /**
   * Truncate the label in its middle when it does not fit, keeping both ends
   * visible so names sharing a prefix (`app1`, `app2`) stay distinguishable.
   *
   * A `Td modifier="truncate"` sets `text-overflow: ellipsis` on the cell,
   * which never reaches text nested in this flex container, so an overlong
   * label is hard clipped instead. `Truncate` also holds the label at a 6ch
   * floor, so it stays readable next to a `trailingItem`. Applies only to a
   * string label; anything else renders unchanged.
   */
  truncateLabel?: boolean;
  trailingItem?: ReactElement;
  trailingItemTooltipMessage?: string;
}> = ({
  iconTooltipMessage,
  icon,
  label,
  truncateLabel = false,
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
    <FlexItem>
      {truncateLabel && typeof label === "string" ? (
        <Truncate
          content={label}
          position="middle"
          /*
            This component takes its tooltips explicitly, and an implicit one
            here would collide with an ancestor that already opens on hover --
            the applications table wraps this in a task popover.
          */
          tooltipProps={{ trigger: "manual", isVisible: false }}
        />
      ) : (
        label
      )}
    </FlexItem>
    {!!trailingItem && (
      <FlexItem>
        <OptionalTooltip tooltipMessage={trailingItemTooltipMessage}>
          {trailingItem}
        </OptionalTooltip>
      </FlexItem>
    )}
  </Flex>
);
