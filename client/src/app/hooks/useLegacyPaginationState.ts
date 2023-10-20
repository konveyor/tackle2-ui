import { PaginationProps } from "@patternfly/react-core";
import {
  getLocalPaginationDerivedState,
  usePaginationState,
  usePaginationEffects,
  usePaginationPropHelpers,
} from "./table-controls";

/**
 * @deprecated Args for useLegacyPaginationState which predates table-controls/table-batteries and is deprecated.
 * @see useLegacyPaginationState
 */
export type PaginationStateProps = Pick<
  PaginationProps,
  "itemCount" | "perPage" | "page" | "onSetPage" | "onPerPageSelect"
>;

/**
 * @deprecated The return value of useLegacyPaginationState which predates table-controls/table-batteries and is deprecated.
 * @see useLegacyPaginationState
 */
export interface ILegacyPaginationStateHook<T> {
  currentPageItems: T[];
  setPageNumber: (pageNumber: number) => void;
  paginationProps: PaginationStateProps;
}

/**
 * @deprecated This hook predates table-controls/table-batteries and still hasn't been refactored away from all of our tables.
 *   This deprecated hook now depends on the table-controls version but wraps it with an API compatible with the legacy usage.
 *   It was refactored to return generic state data and decouple the client-side-pagination piece to another helper function.
 *   See usePaginationState for the new version, which should probably be used instead of this everywhere eventually.
 *   See getLocalPaginationDerivedState and usePaginationPropHelpers for the pieces that were removed here.
 * @see usePaginationState
 * @see getLocalPaginationDerivedState
 * @see getPaginationProps
 */
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
