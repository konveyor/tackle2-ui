import * as React from "react";
import { Flex, FlexItem, Icon, Text } from "@patternfly/react-core";
import ExternalLinkAltIcon from "@patternfly/react-icons/dist/esm/icons/external-link-alt-icon";

/**
 * Render a link open an external href in another tab with appropriate styling.
 */
export const ExternalLink: React.FC<{
  href: string;
  children: React.ReactNode;
}> = ({ href, children }) => (
  <Flex spaceItems={{ default: "spaceItemsSm" }}>
    <FlexItem>
      <Text component="a" href={href} target="_blank">
        {children}
      </Text>
    </FlexItem>
    <FlexItem>
      <Icon size="sm" status="info">
        <ExternalLinkAltIcon />
      </Icon>
    </FlexItem>
  </Flex>
);

export default ExternalLink;
