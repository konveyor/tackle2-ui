import { useState } from "react";

export interface ISelectionStateArgs<T> {
  pageItems: T[];
  totalItems: number;
  initialSelected?: T[];
  isEqual?: (a: T, b: T) => boolean;
  externalState?: [T[], React.Dispatch<React.SetStateAction<T[]>>];
}

export interface ISelectionState<T> {
  selectedItems: T[];
  isItemSelected: (item: T) => boolean;
  toggleItemSelected: (item: T, isSelecting?: boolean) => void;
  selectMultiple: (items: T[], isSelecting: boolean) => void;
  areAllSelected: boolean;
  selectAllPage: (isSelecting?: boolean) => void;
  setSelectedItems: (items: T[]) => void;
}

export const useSelectionFromPageState = <T>({
  pageItems,
  totalItems,
  initialSelected = [],
  isEqual = (a, b) => a === b,
  externalState,
}: ISelectionStateArgs<T>): ISelectionState<T> => {
  const internalState = useState<T[]>(initialSelected);
  const [selectedItems, setSelectedItems] = externalState || internalState;

  const isItemSelected = (item: T) =>
    selectedItems.some((i) => isEqual(item, i));

  const toggleItemSelected = (item: T, isSelecting = !isItemSelected(item)) => {
    if (isSelecting) {
      setSelectedItems([...selectedItems, item]);
    } else {
      setSelectedItems(selectedItems.filter((i) => !isEqual(i, item)));
    }
  };

  const selectMultiple = (items: T[], isSelecting: boolean) => {
    const otherSelectedItems = selectedItems.filter(
      (selected) => !items.some((item) => isEqual(selected, item))
    );
    if (isSelecting) {
      setSelectedItems([...otherSelectedItems, ...items]);
    } else {
      setSelectedItems(otherSelectedItems);
    }
  };

  const selectAllPage = (isSelecting = true) =>
    selectMultiple(pageItems, isSelecting);
  const areAllSelected = selectedItems.length === totalItems;

  return {
    selectedItems,
    isItemSelected,
    toggleItemSelected,
    selectMultiple,
    areAllSelected,
    selectAllPage,
    setSelectedItems,
  };
};
