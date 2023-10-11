import { usePersistentState } from "@app/hooks/usePersistentState";
import { IFeaturePersistenceArgs } from "../types";

export interface IActivePagination {
  pageNumber: number;
  itemsPerPage: number;
}

export interface IPaginationState extends IActivePagination {
  setPageNumber: (pageNumber: number) => void;
  setItemsPerPage: (numItems: number) => void;
}

export interface IPaginationStateArgs {
  initialItemsPerPage?: number;
  isEnabled?: boolean;
}

export const usePaginationState = <
  TPersistenceKeyPrefix extends string = string,
>(
  args: IPaginationStateArgs & IFeaturePersistenceArgs<TPersistenceKeyPrefix>
): IPaginationState => {
  const {
    persistTo = "state",
    persistenceKeyPrefix,
    initialItemsPerPage = 10,
    isEnabled,
  } = args;

  const defaultValue: IActivePagination = {
    pageNumber: 1,
    itemsPerPage: initialItemsPerPage,
  };

  // We won't need to pass the latter two type params here if TS adds support for partial inference.
  // See https://github.com/konveyor/tackle2-ui/issues/1456
  const [paginationState, setPaginationState] = usePersistentState<
    IActivePagination,
    TPersistenceKeyPrefix,
    "pageNumber" | "itemsPerPage"
  >({
    defaultValue,
    persistenceKeyPrefix,
    isEnabled,
    // Note: For the discriminated union here to work without TypeScript getting confused
    //       (e.g. require the urlParams-specific options when persistTo === "urlParams"),
    //       we need to pass persistTo inside each type-narrowed options object instead of outside the ternary.
    ...(persistTo === "urlParams"
      ? {
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
          persistTo,
          key: "pagination",
        }
      : { persistTo }),
  });
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
