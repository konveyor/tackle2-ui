import { FC, Ref, useState } from "react";
import {
  MenuToggle,
  MenuToggleElement,
  MenuToggleProps,
  Select,
  SelectList,
  SelectOption,
} from "@patternfly/react-core";

import { FilterSelectOptionProps } from "../FilterToolbar";

export interface SimpleSelectProps {
  isScrollable?: boolean;
  options: FilterSelectOptionProps[];
  value?: string;
  onSelect: (value: string) => void;
  placeholderText?: string;
  isDisabled?: boolean;
  isFullWidth?: boolean;
  ariaLabel?: string;
  toggleId: string;
  toggleAriaLabel?: string;
  toggleStatus?: MenuToggleProps["status"];
}

const SimpleSelect: FC<SimpleSelectProps> = ({
  isScrollable = true,
  options,
  value: selectedValue,
  onSelect,
  placeholderText = "Select...",
  isDisabled,
  isFullWidth = true,
  ariaLabel,
  toggleId,
  toggleAriaLabel,
  toggleStatus,
}) => {
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  const toggle = (toggleRef: Ref<MenuToggleElement>) => {
    const selectedOption = options.find(
      (option) => option.value === selectedValue
    );
    const displayText =
      selectedOption?.optionProps?.children ??
      selectedOption?.label ??
      (selectedValue || placeholderText); // empty string is often used as no selection

    return (
      <MenuToggle
        aria-label={toggleAriaLabel ?? ariaLabel}
        ouiaId={toggleId}
        ref={toggleRef}
        onClick={() => {
          setIsFilterDropdownOpen(!isFilterDropdownOpen);
        }}
        isExpanded={isFilterDropdownOpen}
        isDisabled={isDisabled || options.length === 0}
        isFullWidth={isFullWidth}
        status={toggleStatus}
      >
        {displayText}
      </MenuToggle>
    );
  };
  return (
    <Select
      ouiaId={`${toggleId}-select`}
      isScrollable={isScrollable}
      aria-label={ariaLabel ?? toggleAriaLabel}
      toggle={toggle}
      onOpenChange={(isOpen) => setIsFilterDropdownOpen(isOpen)}
      selected={selectedValue}
      onSelect={(_, value) => {
        onSelect(value as string);
        setIsFilterDropdownOpen(false);
      }}
      isOpen={isFilterDropdownOpen}
      shouldFocusToggleOnSelect
    >
      <SelectList id={`${toggleId}-listbox`}>
        {options.map(({ label, value, optionProps }) => (
          <SelectOption
            {...optionProps}
            key={value}
            value={value}
            isSelected={value === selectedValue}
          >
            {optionProps?.children ?? label ?? value}
          </SelectOption>
        ))}
      </SelectList>
    </Select>
  );
};

export default SimpleSelect;
