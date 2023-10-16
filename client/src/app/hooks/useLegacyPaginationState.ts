import { PaginationProps } from "@patternfly/react-core";
import {
  getLocalPaginationDerivedState,
  usePaginationState,
  usePaginationEffects,
  usePaginationPropHelpers,
} from "./table-controls";

// NOTE: This was refactored to return generic state data and decouple the client-side-pagination piece to another helper function.
//       See usePaginationState for the new version, which should probably be used instead of this everywhere eventually.
//       See useLocalPaginationDerivedState and getPaginationProps for the pieces that were removed here.

export type PaginationStateProps = Pick<
  PaginationProps,
  "itemCount" | "perPage" | "page" | "onSetPage" | "onPerPageSelect"
>;

export interface ILegacyPaginationStateHook<T> {
  currentPageItems: T[];
  setPageNumber: (pageNumber: number) => void;
  paginationProps: PaginationStateProps;
}

export const useLegacyPaginationState = <T>(
  items: T[],
  initialItemsPerPage: number
): ILegacyPaginationStateHook<T> => {
  const paginationState = usePaginationState({
    isPaginationEnabled: true,
    initialItemsPerPage,
  });
  usePaginationEffects({ paginationState, totalItemCount: items.length });
  const { currentPageItems } = getLocalPaginationDerivedState({
    items,
    paginationState,
  });
  const { paginationProps } = usePaginationPropHelpers({
    totalItemCount: items.length,
    paginationState,
  });
  const { setPageNumber } = paginationState;
  return {
    currentPageItems,
    setPageNumber,
    paginationProps,
  };
};
