import { TdProps } from "@patternfly/react-table";
import { IToolbarBulkSelectorProps } from "@app/components/ToolbarBulkSelector";
import { useSelectionState } from "../useSelectionState/useSelectionState";

export interface BulkSelectionArgs<ItemType> {
  /**
   * Function to check if two items are equal.
   */
  isEqual?: (a: ItemType, b: ItemType) => boolean;
  /**
   * The full set of items that may be selected.  If this contains more items than in
   * `currentPageItems`, then selection across multiple pages is possible.
   */
  items?: ItemType[];
  /**
   * The subset of `items` that satisfy the current filter state.
   */
  filteredItems?: ItemType[];
  /**
   * Current set of items being displayed from either derived state pagination
   * or server side pagination.
   */
  currentPageItems: ItemType[];
  /**
   * Set of items to initially set as selected.
   */
  initialSelected?: ItemType[];
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
  isEqual = (a, b) => a === b,
  items,
  filteredItems,
  currentPageItems,
  initialSelected,
}: BulkSelectionArgs<T>): BulkSelectionValues<T> => {
  const biggestSetOfItems = items ?? filteredItems ?? currentPageItems;

  const {
    selectedItems,
    areAllSelected,
    isItemSelected,
    selectItems,
    selectOnly,
    selectAll,
  } = useSelectionState({
    items: biggestSetOfItems,
    isEqual,
    initialSelected,
  });

  const toolbarBulkSelectorProps: IToolbarBulkSelectorProps = {
    areAllSelected,
    itemCounts: {
      selected: selectedItems.length,
      page: currentPageItems.length,
      filtered: filteredItems ? filteredItems.length : undefined,
      totalItems: biggestSetOfItems.length,
    },

    onSelectNone: () => selectAll(false),

    onSelectCurrentPage: () => selectOnly(currentPageItems),

    onSelectAllFiltered: filteredItems
      ? () => selectOnly(filteredItems)
      : undefined,

    onSelectAll: items ? () => selectAll(true) : undefined,
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
