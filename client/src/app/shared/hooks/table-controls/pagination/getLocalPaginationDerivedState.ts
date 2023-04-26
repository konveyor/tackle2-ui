import { IPaginationState } from "./usePaginationState";

export interface ILocalPaginationDerivedStateArgs<TItem> {
  items: TItem[];
}

export const getLocalPaginationDerivedState = <TItem>({
  paginationState: { pageNumber, itemsPerPage },
  items,
}: ILocalPaginationDerivedStateArgs<TItem> & {
  paginationState: IPaginationState;
}) => {
  const pageStartIndex = (pageNumber - 1) * itemsPerPage;
  const currentPageItems = items.slice(
    pageStartIndex,
    pageStartIndex + itemsPerPage
  );
  return { currentPageItems };
};
