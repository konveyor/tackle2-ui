import * as React from "react";

export interface IPaginationStateArgs<TItem> {
  items: TItem[];
  initialItemsPerPage?: number;
}

export interface IPaginationStateHook<TItem> {
  currentPageItems: TItem[];
  pageNumber: number;
  setPageNumber: (pageNumber: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (numItems: number) => void;
}

export const usePaginationState = <TItem>({
  items,
  initialItemsPerPage = 10,
}: IPaginationStateArgs<TItem>): IPaginationStateHook<TItem> => {
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
