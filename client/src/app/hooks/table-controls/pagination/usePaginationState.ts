import {
  BaseUsePersistentStateOptions,
  usePersistentState,
} from "@app/hooks/usePersistentState";
import { IPersistenceOptions } from "../types";

export interface IPaginationState {
  pageNumber: number;
  setPageNumber: (pageNumber: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (numItems: number) => void;
}

export interface IPaginationStateArgs {
  initialItemsPerPage?: number;
}

export const usePaginationState = <
  TPersistenceKeyPrefix extends string = string,
>(
  args: IPaginationStateArgs & IPersistenceOptions<TPersistenceKeyPrefix>
): IPaginationState => {
  const {
    persistTo = "state",
    persistenceKeyPrefix,
    initialItemsPerPage = 10,
  } = args;

  const defaultValue = { pageNumber: 1, itemsPerPage: initialItemsPerPage };
  const baseStateOptions: BaseUsePersistentStateOptions<
    typeof defaultValue | null
  > = { defaultValue, persistenceKeyPrefix };

  const [paginationState, setPaginationState] = usePersistentState(
    persistTo === "urlParams"
      ? {
          ...baseStateOptions,
          persistTo,
          keys: ["pageNumber", "itemsPerPage"],
          serialize: (state) => {
            const { pageNumber, itemsPerPage } = state || {};
            return {
              pageNumber: pageNumber ? String(pageNumber) : undefined,
              itemsPerPage: itemsPerPage ? String(itemsPerPage) : undefined,
            };
          },
          deserialize: (urlParams) => {
            const { pageNumber, itemsPerPage } = urlParams || {};
            return pageNumber && itemsPerPage
              ? {
                  pageNumber: parseInt(pageNumber, 10),
                  itemsPerPage: parseInt(itemsPerPage, 10),
                }
              : defaultValue;
          },
        }
      : persistTo === "localStorage" || persistTo === "sessionStorage"
      ? {
          ...baseStateOptions,
          persistTo,
          key: `${
            persistenceKeyPrefix ? `${persistenceKeyPrefix}:` : ""
          }pagination`,
        }
      : { ...baseStateOptions, persistTo }
  );
  const { pageNumber, itemsPerPage } = paginationState || defaultValue;
  const setPageNumber = (num: number) =>
    setPaginationState({
      pageNumber: num >= 1 ? num : 1,
      itemsPerPage: paginationState?.itemsPerPage || initialItemsPerPage,
    });
  const setItemsPerPage = (itemsPerPage: number) =>
    setPaginationState({
      pageNumber: paginationState?.pageNumber || 1,
      itemsPerPage,
    });
  return { pageNumber, setPageNumber, itemsPerPage, setItemsPerPage };
};

// TODO look for and replace all usages of usePaginationUrlParams and fix usage of usePaginationState
