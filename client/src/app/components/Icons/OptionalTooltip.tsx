import React from "react";
import { Tooltip } from "@patternfly/react-core";

export const OptionalTooltip: React.FC<{
  tooltipMessage?: string;
  children: React.ReactElement;
}> = ({ children, tooltipMessage }) =>
  tooltipMessage ? (
    <Tooltip content={tooltipMessage}>{children}</Tooltip>
  ) : (
    <>{children}</>
  );
