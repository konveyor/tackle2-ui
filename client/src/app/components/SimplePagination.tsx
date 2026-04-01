import * as React from "react";
import { Pagination, PaginationVariant } from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
// PF v6 removed styles.modifiers.compact — use isCompact prop directly

import { PaginationStateProps } from "@app/hooks/useLegacyPaginationState";

export interface SimplePaginationProps {
  paginationProps: PaginationStateProps;
  isTop: boolean;
  isCompact?: boolean;
  noMargin?: boolean;
  idPrefix?: string;
}

export const SimplePagination: React.FC<SimplePaginationProps> = ({
  paginationProps,
  isTop,
  isCompact = false,
  noMargin = false,
  idPrefix = "",
}) => {
  return (
    <Pagination
      id={`${idPrefix ? `${idPrefix}-` : ""}pagination-${
        isTop ? "top" : "bottom"
      }`}
      variant={isTop ? PaginationVariant.top : PaginationVariant.bottom}
      isCompact={isCompact}
      className={isTop || noMargin ? "" : spacing.mtMd}
      {...paginationProps}
      widgetId="pagination-id"
    />
  );
};
