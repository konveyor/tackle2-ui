import React from "react";

import { Pagination, PaginationVariant } from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { PaginationStateProps } from "@app/shared/hooks/usePaginationState";

export interface SimplePaginationProps {
  paginationProps: PaginationStateProps;
  isTop: boolean;
}

export const SimplePagination: React.FC<SimplePaginationProps> = ({
  paginationProps,
  isTop,
}) => {
  return (
    <Pagination
      variant={isTop ? PaginationVariant.top : PaginationVariant.bottom}
      className={spacing.mtMd}
      {...paginationProps}
      widgetId="pagination-id"
    />
  );
};
