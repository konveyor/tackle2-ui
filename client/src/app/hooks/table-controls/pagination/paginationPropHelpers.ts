import { PaginationProps } from "@patternfly/react-core";
import { IPaginationState } from "./usePaginationState";

// Args that should be passed into useTableControlProps
export interface IPaginationPropHelpersExternalArgs {
  paginationState: IPaginationState;
  totalItemCount: number;
}

export const getPaginationProps = ({
  paginationState: { pageNumber, setPageNumber, itemsPerPage, setItemsPerPage },
  totalItemCount,
}: IPaginationPropHelpersExternalArgs): PaginationProps => ({
  itemCount: totalItemCount,
  perPage: itemsPerPage,
  page: pageNumber,
  onSetPage: (event, pageNumber) => setPageNumber(pageNumber),
  onPerPageSelect: (event, perPage) => {
    setPageNumber(1);
    setItemsPerPage(perPage);
  },
});
