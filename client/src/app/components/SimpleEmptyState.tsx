import * as React from "react";
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateVariant,
} from "@patternfly/react-core";

export interface SimpleEmptyStateProps {
  icon?: React.ComponentType;
  title: string;
  description?: string;
  primaryAction?: React.ReactNode;
}

export const SimpleEmptyState: React.FC<SimpleEmptyStateProps> = ({
  icon,
  title,
  description,
  primaryAction,
}) => {
  return (
    <EmptyState
      headingLevel="h2"
      icon={icon}
      titleText={title}
      variant={EmptyStateVariant.sm}
    >
      {description && <EmptyStateBody>{description}</EmptyStateBody>}
      <EmptyStateFooter>{primaryAction}</EmptyStateFooter>
    </EmptyState>
  );
};
