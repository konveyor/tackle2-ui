import { useCallback, useMemo, useState } from "react";

export interface ISelectionStateArgs<T> {
  items: T[];
  initialSelected?: T[];
  isEqual?: (a: T, b: T) => boolean;
}

export interface ISelectionState<T> {
  selectedItems: T[];
  isItemSelected: (item: T) => boolean;
  areAllSelected: boolean;
  selectItems: (items: T[], isSelected: boolean) => void;
  selectOnly: (items: T[]) => void;
  selectAll: (isSelected: boolean) => void;
}

function doSelect<T>(
  isEqual: (a: T, b: T) => boolean,
  fullSet: T[],
  selections: T[]
) {
  return selections.length === 0
    ? []
    : fullSet.filter((item) => selections.some((test) => isEqual(item, test)));
}

export const useSelectionState = <T>({
  items,
  initialSelected = [],
  isEqual = (a, b) => a === b,
}: ISelectionStateArgs<T>): ISelectionState<T> => {
  const [selectedSet, setSelectedSet] = useState<T[]>(
    doSelect(isEqual, items, initialSelected)
  );

  const isItemSelected = useCallback(
    (item: T) => selectedSet.some((i) => isEqual(item, i)),
    [isEqual, selectedSet]
  );

  const selectItems = useCallback(
    (itemsSubset: T[], isSelecting: boolean) => {
      const verifiedItemsSubset = doSelect(isEqual, items, itemsSubset);
      const selectedNotInItemsSubset = selectedSet.filter(
        (selected) =>
          !verifiedItemsSubset.some((item) => isEqual(selected, item))
      );
      if (isSelecting) {
        setSelectedSet([...selectedNotInItemsSubset, ...verifiedItemsSubset]);
      } else {
        setSelectedSet(selectedNotInItemsSubset);
      }
    },
    [isEqual, items, selectedSet]
  );

  const selectOnly = useCallback(
    (toSelect: T[]) => {
      const filtered = doSelect(isEqual, items, toSelect);
      setSelectedSet(filtered);
    },
    [isEqual, items]
  );

  const selectAll = useCallback(
    (isSelecting: boolean) => setSelectedSet(isSelecting ? items : []),
    [items]
  );

  const areAllSelected = useMemo(() => {
    return (
      selectedSet.length === items.length &&
      selectedSet.every((si) => items.some((i) => isEqual(si, i)))
    );
  }, [selectedSet, items, isEqual]);

  const selectedItems = useMemo(() => {
    if (selectedSet.length === 0) {
      return [];
    }
    if (areAllSelected) {
      return items;
    }
    return items.filter(isItemSelected);
  }, [areAllSelected, isItemSelected, items, selectedSet]);

  return {
    selectedItems,
    isItemSelected,
    areAllSelected,
    selectItems,
    selectOnly,
    selectAll,
  };
};
