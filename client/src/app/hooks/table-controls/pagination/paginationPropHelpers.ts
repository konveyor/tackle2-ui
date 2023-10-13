import { PaginationProps } from "@patternfly/react-core";
import { IPaginationState } from "./usePaginationState";

export interface IPaginationPropHelpersArgs {
  paginationState: IPaginationState;
  totalItemCount: number;
}

export const getPaginationProps = ({
  paginationState: { pageNumber, setPageNumber, itemsPerPage, setItemsPerPage },
  totalItemCount,
}: IPaginationPropHelpersArgs): PaginationProps => ({
  itemCount: totalItemCount,
  perPage: itemsPerPage,
  page: pageNumber,
  onSetPage: (event, pageNumber) => setPageNumber(pageNumber),
  onPerPageSelect: (event, perPage) => {
    setPageNumber(1);
    setItemsPerPage(perPage);
  },
});
