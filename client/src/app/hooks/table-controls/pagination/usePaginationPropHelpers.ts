import { PaginationProps, ToolbarItemProps } from "@patternfly/react-core";
import { IPaginationState } from "./usePaginationState";
import {
  IUsePaginationEffectsArgs,
  usePaginationEffects,
} from "./usePaginationEffects";

// Args that should be passed into useTableControlProps
export type IPaginationPropHelpersExternalArgs = IUsePaginationEffectsArgs & {
  paginationState: IPaginationState;
  totalItemCount: number;
};

export const usePaginationPropHelpers = (
  args: IPaginationPropHelpersExternalArgs
) => {
  const {
    totalItemCount,
    paginationState: {
      itemsPerPage,
      pageNumber,
      setPageNumber,
      setItemsPerPage,
    },
  } = args;

  usePaginationEffects(args);

  const paginationProps: PaginationProps = {
    itemCount: totalItemCount,
    perPage: itemsPerPage,
    page: pageNumber,
    onSetPage: (event, pageNumber) => setPageNumber(pageNumber),
    onPerPageSelect: (event, perPage) => {
      setPageNumber(1);
      setItemsPerPage(perPage);
    },
  };

  const paginationToolbarItemProps: ToolbarItemProps = {
    variant: "pagination",
    align: { default: "alignRight" },
  };

  return { paginationProps, paginationToolbarItemProps };
};
