import * as React from "react";
import { PaginationProps } from "@patternfly/react-core";

// TODO these could be given generic types to avoid using `any` (https://www.typescriptlang.org/docs/handbook/generics.html)

export type PaginationStateProps = Pick<
  PaginationProps,
  "itemCount" | "perPage" | "page" | "onSetPage" | "onPerPageSelect"
>;

export interface IPaginationStateHook<T> {
  currentPageItems: T[];
  setPageNumber: (pageNumber: number) => void;
  paginationProps: PaginationStateProps;
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

  const paginationProps: PaginationStateProps = {
    itemCount: items.length,
    perPage: itemsPerPage,
    page: pageNumber,
    onSetPage: (event, pageNumber) => setPageNumber(pageNumber),
    onPerPageSelect: (event, perPage) => {
      setPageNumber(1);
      setItemsPerPage(perPage);
    },
  };

  return {
    currentPageItems,
    setPageNumber,
    paginationProps,
  };
};
