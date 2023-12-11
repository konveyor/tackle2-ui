import * as React from "react";
import { Button, Icon } from "@patternfly/react-core";
import ExternalLinkAltIcon from "@patternfly/react-icons/dist/esm/icons/external-link-alt-icon";

/**
 * Render a link open an external href in another tab with appropriate styling.
 */
export const ExternalLink: React.FC<{
  href: string;
  isInline?: boolean;
  children: React.ReactNode;
}> = ({ href, isInline = false, children }) => (
  <Button
    variant="link"
    isInline={isInline}
    component="a"
    href={href}
    target="_blank"
    rel="noreferrer"
    icon={
      <Icon size="sm" status="info">
        <ExternalLinkAltIcon />
      </Icon>
    }
    iconPosition="right"
  >
    {children}
  </Button>
);

export default ExternalLink;
