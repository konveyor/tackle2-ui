import * as React from "react";

export interface ISelectionStateArgs<T> {
  items: T[];
  initialSelected?: T[];
  isEqual?: (a: T, b: T) => boolean;
}

export interface ISelectionState<T> {
  selectedItems: T[];
  isItemSelected: (item: T) => boolean;
  areAllSelected: boolean;
  selectItem: (item: T, isSelected: boolean) => void;
  selectItems: (items: T[], isSelected: boolean) => void;
  selectOnly: (items: T[]) => void;
  selectAll: (isSelected: boolean) => void;
}

export const useSelectionState = <T>({
  items,
  initialSelected = [],
  isEqual = (a, b) => a === b,
}: ISelectionStateArgs<T>): ISelectionState<T> => {
  const [selectedItems, setSelectedItems] =
    React.useState<T[]>(initialSelected);

  const isItemSelected = React.useCallback(
    (item: T) => selectedItems.some((i) => isEqual(item, i)),
    [isEqual, selectedItems]
  );

  const selectItem = React.useCallback(
    (item: T, isSelecting) => {
      if (isSelecting) {
        setSelectedItems([...selectedItems, item]);
      } else {
        setSelectedItems(selectedItems.filter((i) => !isEqual(i, item)));
      }
    },
    [isEqual, selectedItems, setSelectedItems]
  );

  const selectItems = React.useCallback(
    (itemsSubset: T[], isSelecting: boolean) => {
      const otherSelectedItems = selectedItems.filter(
        (selected) => !itemsSubset.some((item) => isEqual(selected, item))
      );
      if (isSelecting) {
        setSelectedItems([...otherSelectedItems, ...itemsSubset]);
      } else {
        setSelectedItems(otherSelectedItems);
      }
    },
    [isEqual, selectedItems, setSelectedItems]
  );

  const selectOnly = React.useCallback(
    (toSelect: T[]) => {
      const filtered = items.filter((item) =>
        toSelect.find((sel) => isEqual(item, sel))
      );
      setSelectedItems(filtered);
    },
    [isEqual, items]
  );

  const selectAll = React.useCallback(
    (isSelecting) => setSelectedItems(isSelecting ? items : []),
    [items, setSelectedItems]
  );
  const areAllSelected = selectedItems.length === items.length;

  const selectedItemsInItemsOrder = React.useMemo(() => {
    if (selectedItems.length === 0) {
      return [];
    }
    if (areAllSelected) {
      return items;
    }
    return items.filter(isItemSelected);
  }, [areAllSelected, isItemSelected, items, selectedItems]);

  return {
    selectedItems: selectedItemsInItemsOrder,
    isItemSelected,
    areAllSelected,
    selectItem,
    selectItems,
    selectOnly,
    selectAll,
  };
};
