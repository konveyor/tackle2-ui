import { IToolbarBulkSelectorProps } from "@app/components/ToolbarBulkSelector";
import { useSelectionState } from "./useSelectionState";
import { TdProps } from "@patternfly/react-table";

export interface BulkSelectionArgs<ItemType> {
  /**
   * The full set of items that may be selected.  If this contains more items than in
   * `currentPageItems`, then selection across multiple pages is possible.
   */
  items: ItemType[];
  /**
   * Function to check if two items are equal.
   */
  isEqual?: (a: ItemType, b: ItemType) => boolean;
  /**
   * Set of items to initially set as selected.
   */
  initialSelected?: ItemType[];
  /**
   * Current set of items being displayed from either derived state pagination
   * or server side pagination.
   */
  currentPageItems: ItemType[];
  /**
   * Count of all filtered items from either derived state filtering or server side filtering.
   */
  totalItemCount: number;
}

export interface BulkSelectionValues<ItemType> {
  selectedItems: ItemType[];
  propHelpers: {
    toolbarBulkSelectorProps: IToolbarBulkSelectorProps;
    getSelectCheckboxTdProps: (args: {
      item: ItemType;
      rowIndex: number;
    }) => Omit<TdProps, "ref">;
  };
}

export const useBulkSelection = <T>({
  items,
  isEqual = (a, b) => a === b,
  initialSelected,
  currentPageItems,
  totalItemCount,
}: BulkSelectionArgs<T>): BulkSelectionValues<T> => {
  const {
    selectedItems,
    areAllSelected,
    isItemSelected,
    selectItems,
    selectOnly,
    selectAll,
  } = useSelectionState({
    items,
    isEqual,
    initialSelected,
  });

  const toolbarBulkSelectorProps: IToolbarBulkSelectorProps = {
    areAllSelected,
    itemCounts: {
      selected: selectedItems.length,
      page: currentPageItems.length,
      filtered: totalItemCount, // TODO: Adjust when enable onSelectAllFiltered
      totalItems: totalItemCount, // TODO: Adjust when enable onSelectAll
    },
    onSelectNone: () => selectAll(false),
    onSelectCurrentPage: () => selectOnly(currentPageItems),
    // TODO: Send these functions only if we know local filtering is active. They don't make
    //       sense in server side pagination/filter/sort.
    // onSelectAllFiltered: () => selectOnly(filteredItems),
    // onSelectAll: () => selectAll(true),
  };

  const getSelectCheckboxTdProps: BulkSelectionValues<T>["propHelpers"]["getSelectCheckboxTdProps"] =
    ({ item, rowIndex }) => ({
      select: {
        rowIndex,
        onSelect: (_event, isSelecting) => {
          selectItems([item], isSelecting);
        },
        isSelected: isItemSelected(item),
      },
    });

  return {
    selectedItems,
    propHelpers: {
      toolbarBulkSelectorProps,
      getSelectCheckboxTdProps,
    },
  };
};
