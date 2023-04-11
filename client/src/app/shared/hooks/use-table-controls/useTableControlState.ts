import { FilterCategory } from "@app/shared/components/FilterToolbar";
import { useFilterState } from "../useFilterState";
import { useCompoundExpansionState } from "../useCompoundExpansionState";
import { useSelectionState } from "@migtools/lib-ui";
import { useSortState } from "../useSortState";
import { usePaginationState } from "../usePaginationState";

export interface UseTableControlStateArgs<
  TItem extends { name: string },
  TColumnNames extends Record<string, string>
> {
  items: TItem[]; // The objects represented by rows in this table
  columnNames: TColumnNames; // An ordered mapping of unique keys to human-readable column name strings
  isSelectable?: boolean;
  expandableVariant?: "single" | "compound" | null;
  hasActionsColumn?: boolean;
  filterCategories?: FilterCategory<TItem>[];
  filterStorageKey?: string;
  getSortValues?: (item: TItem) => Record<keyof TColumnNames, string | number>;
  hasPagination?: boolean;
  initialItemsPerPage?: number;
}

export const useTableControlState = <
  TItem extends { name: string },
  TColumnNames extends Record<string, string>
>(
  args: UseTableControlStateArgs<TItem, TColumnNames>
) => {
  const {
    items,
    columnNames,
    isSelectable = false,
    expandableVariant = null,
    hasActionsColumn = false,
    filterCategories = [],
    filterStorageKey,
    getSortValues,
    hasPagination = true,
    initialItemsPerPage = 10,
  } = args;

  // Some table controls rely on extra columns inserted before or after the ones included in columnNames.
  // We need to account for those when dealing with props based on column index and colSpan.
  let numRenderedColumns = Object.keys(columnNames).length;
  let firstDataColumnIndex = 0;
  if (isSelectable) {
    numRenderedColumns++;
    firstDataColumnIndex++; // Select checkbox column goes on the left
  }
  if (expandableVariant === "single") {
    numRenderedColumns++;
    firstDataColumnIndex++; // Expand toggle column goes on the left
  }
  if (hasActionsColumn) numRenderedColumns++;

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
    ...args,
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
