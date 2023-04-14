import React from "react";

import { Pagination, PaginationVariant } from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { PaginationStateProps } from "@app/shared/hooks/useLegacyPaginationState";

export interface SimplePaginationProps {
  paginationProps: PaginationStateProps;
  isTop: boolean;
  idPrefix?: string;
}

export const SimplePagination: React.FC<SimplePaginationProps> = ({
  paginationProps,
  isTop,
  idPrefix = "",
}) => {
  return (
    <Pagination
      id={`${idPrefix ? `${idPrefix}-` : ""}pagination-${
        isTop ? "top" : "bottom"
      }`}
      variant={isTop ? PaginationVariant.top : PaginationVariant.bottom}
      className={spacing.mtMd}
      {...paginationProps}
      widgetId="pagination-id"
    />
  );
};
