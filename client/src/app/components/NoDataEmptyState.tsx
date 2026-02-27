import * as React from "react";
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateIcon,
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
    <EmptyState variant={EmptyStateVariant.sm}>
      <EmptyStateHeader
        titleText={title}
        icon={<EmptyStateIcon icon={CubesIcon} />}
        headingLevel="h2"
      />

      {description && <EmptyStateBody>{description}</EmptyStateBody>}
    </EmptyState>
  );
};
