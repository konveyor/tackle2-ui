import { IPaginationState } from "./usePaginationState";

export interface IUseLocalPaginationDerivedStateArgs<TItem> {
  items: TItem[];
}

export const useLocalPaginationDerivedState = <TItem>({
  items,
  paginationState: { pageNumber, itemsPerPage },
}: IUseLocalPaginationDerivedStateArgs<TItem> & {
  paginationState: IPaginationState;
}) => {
  const pageStartIndex = (pageNumber - 1) * itemsPerPage;
  const currentPageItems = items.slice(
    pageStartIndex,
    pageStartIndex + itemsPerPage
  );
  return { currentPageItems };
};
