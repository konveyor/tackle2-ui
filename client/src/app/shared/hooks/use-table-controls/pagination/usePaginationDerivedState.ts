import { IPaginationState } from "./usePaginationState";

export interface IPaginationDerivedStateArgs<TItem> {
  paginationState: IPaginationState;
  items: TItem[];
}

export const usePaginationDerivedState = <TItem>({
  paginationState: { pageNumber, itemsPerPage },
  items,
}: IPaginationDerivedStateArgs<TItem>) => {
  const pageStartIndex = (pageNumber - 1) * itemsPerPage;
  const currentPageItems = items.slice(
    pageStartIndex,
    pageStartIndex + itemsPerPage
  );
  return { currentPageItems };
};
