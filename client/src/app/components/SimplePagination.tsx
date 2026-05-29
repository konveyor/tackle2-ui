import * as React from "react";
import {
  Pagination,
  PaginationProps,
  PaginationVariant,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

export interface SimplePaginationProps {
  paginationProps: Pick<
    PaginationProps,
    "itemCount" | "perPage" | "page" | "onSetPage" | "onPerPageSelect"
  >;
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
      className={isTop || noMargin ? "" : spacing.mtMd}
      isCompact={isCompact}
      {...paginationProps}
      widgetId="pagination-id"
    />
  );
};
