import * as React from "react";
import { useUrlParams } from "../../useUrlParams";

export interface IPaginationState {
  pageNumber: number;
  setPageNumber: (pageNumber: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (numItems: number) => void;
}

export interface IPaginationStateArgs {
  totalItemCount: number;
  initialItemsPerPage?: number;
}

const useEnsurePageExistsEffect = ({
  pageNumber,
  setPageNumber,
  itemsPerPage,
  totalItemCount,
}: Pick<IPaginationState, "pageNumber" | "setPageNumber" | "itemsPerPage"> &
  Pick<IPaginationStateArgs, "totalItemCount">) => {
  // When items are removed, make sure the current page still exists
  const lastPageNumber = Math.max(Math.ceil(totalItemCount / itemsPerPage), 1);
  React.useEffect(() => {
    if (pageNumber > lastPageNumber) {
      setPageNumber(lastPageNumber);
    }
  });
};

export const usePaginationState = ({
  totalItemCount,
  initialItemsPerPage = 10,
}: IPaginationStateArgs): IPaginationState => {
  const [pageNumber, baseSetPageNumber] = React.useState(1);
  const setPageNumber = (num: number) => baseSetPageNumber(num >= 1 ? num : 1);
  const [itemsPerPage, setItemsPerPage] = React.useState(initialItemsPerPage);

  useEnsurePageExistsEffect({
    pageNumber,
    setPageNumber,
    itemsPerPage,
    totalItemCount,
  });

  return { pageNumber, setPageNumber, itemsPerPage, setItemsPerPage };
};

export const usePaginationUrlParams = ({
  totalItemCount,
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

  const setPageNumber = (pageNumber: number) => setParams({ pageNumber });
  const setItemsPerPage = (itemsPerPage: number) => setParams({ itemsPerPage });

  useEnsurePageExistsEffect({
    pageNumber,
    setPageNumber,
    itemsPerPage,
    totalItemCount,
  });

  return {
    pageNumber: pageNumber || 1,
    itemsPerPage: itemsPerPage || initialItemsPerPage,
    setPageNumber,
    setItemsPerPage,
  };
};
