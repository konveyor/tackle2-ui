import * as React from "react";
import { useUrlParams } from "../../useUrlParams";

export interface IPaginationState {
  pageNumber: number;
  setPageNumber: (pageNumber: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (numItems: number) => void;
}

export interface IPaginationStateArgs {
  initialItemsPerPage?: number;
}

export const usePaginationState = ({
  initialItemsPerPage = 10,
}: IPaginationStateArgs): IPaginationState => {
  const [pageNumber, baseSetPageNumber] = React.useState(1);
  const setPageNumber = (num: number) => baseSetPageNumber(num >= 1 ? num : 1);
  const [itemsPerPage, setItemsPerPage] = React.useState(initialItemsPerPage);
  return { pageNumber, setPageNumber, itemsPerPage, setItemsPerPage };
};

export const usePaginationUrlParams = ({
  initialItemsPerPage = 10,
}: IPaginationStateArgs): IPaginationState => {
  const defaultParams = { pageNumber: 1, itemsPerPage: initialItemsPerPage };
  const {
    params: { pageNumber, itemsPerPage },
    setParams,
  } = useUrlParams({
    keys: ["pageNumber", "itemsPerPage"],
    defaultParams,
    serialize: ({ pageNumber, itemsPerPage }) => ({
      pageNumber: pageNumber ? String(pageNumber) : undefined,
      itemsPerPage: itemsPerPage ? String(itemsPerPage) : undefined,
    }),
    deserialize: ({ pageNumber, itemsPerPage }) =>
      pageNumber && itemsPerPage
        ? {
            pageNumber: parseInt(pageNumber, 10),
            itemsPerPage: parseInt(itemsPerPage, 10),
          }
        : defaultParams,
  });

  const setPageNumber = (pageNumber: number) =>
    setParams({ pageNumber: pageNumber >= 1 ? pageNumber : 1 });
  const setItemsPerPage = (itemsPerPage: number) => setParams({ itemsPerPage });

  return {
    pageNumber: pageNumber || 1,
    itemsPerPage: itemsPerPage || initialItemsPerPage,
    setPageNumber,
    setItemsPerPage,
  };
};
