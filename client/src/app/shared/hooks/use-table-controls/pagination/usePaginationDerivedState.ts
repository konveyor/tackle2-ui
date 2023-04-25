import { IPaginationState } from "./usePaginationState";

export interface IPaginationDerivedStateArgs<TItem> {
  items: TItem[];
}

export const usePaginationDerivedState = <TItem>({
  paginationState: { pageNumber, itemsPerPage },
  items,
}: IPaginationDerivedStateArgs<TItem> & {
  paginationState: IPaginationState;
}) => {
  const pageStartIndex = (pageNumber - 1) * itemsPerPage;
  const currentPageItems = items.slice(
    pageStartIndex,
    pageStartIndex + itemsPerPage
  );
  return { currentPageItems };
};
