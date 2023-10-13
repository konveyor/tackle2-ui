import * as React from "react";
import { IPaginationState } from "./usePaginationState";

export interface IUsePaginationEffectsArgs {
  isPaginationEnabled?: boolean;
  paginationState: IPaginationState;
  totalItemCount: number;
  isLoading?: boolean;
}

export const usePaginationEffects = ({
  isPaginationEnabled,
  paginationState: { itemsPerPage, pageNumber, setPageNumber },
  totalItemCount,
  isLoading = false,
}: IUsePaginationEffectsArgs) => {
  // When items are removed, make sure the current page still exists
  const lastPageNumber = Math.max(Math.ceil(totalItemCount / itemsPerPage), 1);
  React.useEffect(() => {
    if (isPaginationEnabled && pageNumber > lastPageNumber && !isLoading) {
      setPageNumber(lastPageNumber);
    }
  });
};
