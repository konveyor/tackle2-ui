import * as React from "react";
import { PaginationProps } from "@patternfly/react-core";

export type PaginationStateProps = Pick<
  PaginationProps,
  "itemCount" | "perPage" | "page" | "onSetPage" | "onPerPageSelect"
>;

export interface IPaginationStateHook<T> {
  currentPageItems: T[];
  pageNumber: number;
  setPageNumber: (pageNumber: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (numItems: number) => void;
}

export const usePaginationState = <T>(
  items: T[],
  initialItemsPerPage: number
): IPaginationStateHook<T> => {
  const [pageNumber, baseSetPageNumber] = React.useState(1);
  const setPageNumber = (num: number) => baseSetPageNumber(num >= 1 ? num : 1);
  const [itemsPerPage, setItemsPerPage] = React.useState(initialItemsPerPage);

  // When items are removed, make sure the current page still exists
  const lastPageNumber = Math.max(Math.ceil(items.length / itemsPerPage), 1);
  React.useEffect(() => {
    if (pageNumber > lastPageNumber) {
      setPageNumber(lastPageNumber);
    }
  });

  const pageStartIndex = (pageNumber - 1) * itemsPerPage;
  const currentPageItems = items.slice(
    pageStartIndex,
    pageStartIndex + itemsPerPage
  );

  return {
    currentPageItems,
    pageNumber,
    setPageNumber,
    itemsPerPage,
    setItemsPerPage,
  };
};
