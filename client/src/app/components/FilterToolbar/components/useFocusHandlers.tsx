import { useState } from "react";

import { FilterSelectOptionProps } from "../FilterToolbar";

import { getStableIndex } from "./selectUtils";

export const useFocusHandlers = ({
  filteredOptions,
  options,
  idPrefix,
}: {
  filteredOptions: FilterSelectOptionProps[];
  options: FilterSelectOptionProps[];
  idPrefix: string;
}) => {
  const [focusedItemIndex, setFocusedItemIndex] = useState<number | null>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  const moveFocusedItemIndex = (key: string) => {
    const newIndex = calculateFocusedItemIndex(key);
    setFocusedItemIndex(newIndex);
    setActiveItemId(
      newIndex !== null
        ? `${idPrefix}-${getStableIndex(filteredOptions[newIndex]?.value, options)}`
        : null
    );
  };

  const resetActiveAndFocusedItem = () => {
    setFocusedItemIndex(null);
    setActiveItemId(null);
  };

  const findLastEnabledItemIndex = (options: FilterSelectOptionProps[]) => {
    const index = options.findLastIndex(
      (option) => !option.optionProps?.isDisabled
    );
    return index !== -1 ? index : null;
  };

  const findFirstEnabledItemIndex = (options: FilterSelectOptionProps[]) => {
    const index = options.findIndex(
      (option) => !option.optionProps?.isDisabled
    );
    return index !== -1 ? index : null;
  };

  const findPreviousEnabledItemIndex = (currentIndex: number) =>
    findLastEnabledItemIndex(filteredOptions.slice(0, currentIndex)) ??
    findLastEnabledItemIndex(filteredOptions);

  const findNextEnabledItemIndex = (currentIndex: number) => {
    const nextIndex = findFirstEnabledItemIndex(
      filteredOptions.slice(currentIndex + 1)
    );
    return nextIndex !== null
      ? nextIndex + currentIndex + 1
      : findFirstEnabledItemIndex(filteredOptions);
  };
  const calculateFocusedItemIndex = (key: string): number | null => {
    if (!filteredOptions.length) {
      return null;
    }

    if (key === "ArrowUp") {
      return focusedItemIndex === null || focusedItemIndex <= 0
        ? findLastEnabledItemIndex(filteredOptions)
        : findPreviousEnabledItemIndex(focusedItemIndex);
    }

    if (key === "ArrowDown") {
      return focusedItemIndex === null ||
        focusedItemIndex >= filteredOptions.length - 1
        ? findFirstEnabledItemIndex(filteredOptions)
        : findNextEnabledItemIndex(focusedItemIndex);
    }

    return null;
  };

  const getFocusedItem = () =>
    focusedItemIndex !== null &&
    filteredOptions[focusedItemIndex] &&
    !filteredOptions[focusedItemIndex]?.optionProps?.isDisabled
      ? filteredOptions[focusedItemIndex]
      : undefined;

  return {
    activeItemId: activeItemId ?? undefined,
    moveFocusedItemIndex,
    focusedItemIndex,
    focusedItem: getFocusedItem(),
    getFocusedItem,
    resetActiveAndFocusedItem,
  };
};
