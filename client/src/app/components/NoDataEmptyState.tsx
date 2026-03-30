import * as React from "react";
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
} from "@patternfly/react-core";
import { CubesIcon } from "@patternfly/react-icons";

export interface NoDataEmptyStateProps {
  title: string;
  description?: string;
}

export const NoDataEmptyState: React.FC<NoDataEmptyStateProps> = ({
  title,
  description,
}) => {
  return (
    <EmptyState
      variant={EmptyStateVariant.sm}
      titleText={title}
      icon={CubesIcon}
      headingLevel="h2"
    >
      {description && <EmptyStateBody>{description}</EmptyStateBody>}
    </EmptyState>
  );
};
