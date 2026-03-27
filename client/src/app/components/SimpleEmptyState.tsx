import * as React from "react";
import {
  EmptyState,
  EmptyStateActions,
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
      variant={EmptyStateVariant.sm}
      titleText={title}
      headingLevel="h2"
      icon={icon}
    >
      {description && <EmptyStateBody>{description}</EmptyStateBody>}
      <EmptyStateFooter>
        <EmptyStateActions>{primaryAction}</EmptyStateActions>
      </EmptyStateFooter>
    </EmptyState>
  );
};
