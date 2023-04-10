import { FilterCategory } from "@app/shared/components/FilterToolbar";
import { useFilterState } from "../useFilterState";
import { useCompoundExpansionState } from "../useCompoundExpansionState";
import { useSelectionState } from "@migtools/lib-ui";
import { useSortState } from "../useSortState";
import { usePaginationState } from "../usePaginationState";

// TODO add a prop for expandable mode? 'single' | 'compound' | null?

export interface UseTableControlStateArgs<
  TItem extends { name: string },
  TColumnNames extends Record<string, string>
> {
  items: TItem[]; // The objects represented by rows in this table
  columnNames: TColumnNames; // An ordered mapping of unique keys to human-readable column name strings
  isSelectable?: boolean;
  hasActionsColumn?: boolean;
  filterCategories?: FilterCategory<TItem>[];
  filterStorageKey?: string;
  getSortValues?: (item: TItem) => Record<keyof TColumnNames, string>;
  hasPagination?: boolean;
  initialItemsPerPage?: number;
}

export const useTableControlState = <
  TItem extends { name: string },
  TColumnNames extends Record<string, string>
>({
  items,
  columnNames,
  isSelectable = false,
  hasActionsColumn = false,
  filterCategories = [],
  filterStorageKey,
  getSortValues,
  hasPagination = true,
  initialItemsPerPage = 10,
}: UseTableControlStateArgs<TItem, TColumnNames>) => {
  const numRenderedColumns =
    Object.keys(columnNames).length +
    (isSelectable ? 1 : 0) +
    (hasActionsColumn ? 1 : 0);

  // TODO also if the table has a single-expand toggle (non-compound expandable rows), add 1 more here
  const firstDataColumnIndex = 0 + (isSelectable ? 1 : 0);

  const filterState = useFilterState(items, filterCategories, filterStorageKey);

  const expansionState = useCompoundExpansionState<TItem, TColumnNames>();

  const selectionState = useSelectionState<TItem>({
    items: filterState.filteredItems || [],
    isEqual: (a, b) => a.name === b.name,
  });

  const sortState = useSortState(
    filterState.filteredItems,
    getSortValues
      ? (item) => {
          // Because useSortState is based on column indexes and we want to base everything on columnKey,
          // we need to convert to an array of strings based on column index here.
          // TODO rewrite or write an alternate useSortState to be based on columnKey instead.
          const sortValuesByColumnKey = getSortValues(item);
          return [
            ...(firstDataColumnIndex > 0
              ? new Array(firstDataColumnIndex).fill("")
              : []),
            ...Object.keys(columnNames).map(
              (columnKey) => sortValuesByColumnKey[columnKey] || ""
            ),
          ];
        }
      : undefined
  );

  const paginationState = usePaginationState(
    sortState.sortedItems,
    initialItemsPerPage
  );

  return {
    columnNames,
    numRenderedColumns,
    firstDataColumnIndex,
    filterState,
    expansionState,
    selectionState,
    sortState,
    paginationState: {
      ...paginationState,
      currentPageItems: hasPagination
        ? paginationState.currentPageItems
        : sortState.sortedItems,
    },
  };
};
