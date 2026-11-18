import { FC, ReactElement, ReactNode } from "react";
import { Flex, FlexItem, Truncate } from "@patternfly/react-core";

import { OptionalTooltip } from "./OptionalTooltip";

/**
 * `Truncate` splits the label only while
 * `content.length - trailingNumChars > 12`, so a shorter trailing slice also
 * lowers the length at which middle truncation starts to apply. At the default
 * 7 a 19 character name still falls back to an end ellipsis -- precisely where
 * names sharing a prefix need their suffix kept.
 */
const TRAILING_CHARS = 4;

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
  /**
   * Drop the tooltip `Truncate` opens while the label is cut. Only for a label
   * whose full text is already reachable another way -- the applications table
   * wraps the name in a task popover, and two overlays would open on the same
   * hover. Everywhere else leave it on: it is the only way to read what was
   * cut off.
   */
  suppressLabelTooltip?: boolean;
  trailingItem?: ReactElement;
  trailingItemTooltipMessage?: string;
}> = ({
  iconTooltipMessage,
  icon,
  label,
  truncateLabel = false,
  suppressLabelTooltip = false,
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
          trailingNumChars={TRAILING_CHARS}
          {...(suppressLabelTooltip && {
            tooltipProps: { trigger: "manual", isVisible: false },
          })}
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
