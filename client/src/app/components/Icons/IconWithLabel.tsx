import { FC, ReactElement, ReactNode } from "react";
import { Flex, FlexItem } from "@patternfly/react-core";
import textStyles from "@patternfly/react-styles/css/utilities/Text/text";

import { OptionalTooltip } from "./OptionalTooltip";

export const IconWithLabel: FC<{
  iconTooltipMessage?: string;
  icon: ReactElement;
  label: ReactNode;
  /**
   * Ellipsize the label when it does not fit. A `Td modifier="truncate"` sets
   * `text-overflow: ellipsis` on the cell, which never reaches text nested in
   * this flex container, so an overlong label is hard clipped instead. Only
   * turn this on for labels of unbounded length, such as a resource name --
   * it lets the label shrink, which a short fixed label does not want.
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
    <FlexItem className={truncateLabel ? textStyles.textTruncate : undefined}>
      {label}
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
