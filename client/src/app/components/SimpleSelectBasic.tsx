import React, { useState } from "react";

import {
  Select,
  SelectList,
  SelectOption,
  SelectOptionProps,
  MenuToggle,
  MenuToggleElement,
} from "@patternfly/react-core";

export interface ISimpleSelectBasicProps {
  onChange: (selection: string) => void;
  options: SelectOptionProps[];
  value?: string;
  placeholderText?: string;
  selectId?: string;
  toggleId?: string;
  toggleAriaLabel?: string;
}

export const SimpleSelectBasic: React.FC<ISimpleSelectBasicProps> = ({
  onChange,
  options,
  value,
  placeholderText = "Select...",
  selectId,
  toggleId,
  toggleAriaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      aria-label={toggleAriaLabel}
      id={toggleId}
      isFullWidth
      ref={toggleRef}
      onClick={() => {
        setIsOpen(!isOpen);
      }}
      isExpanded={isOpen}
    >
      {(value && (options.find((o) => o.value === value)?.children || value)) ||
        placeholderText ||
        ""}
    </MenuToggle>
  );

  return (
    <Select
      id={selectId}
      isOpen={isOpen}
      toggle={toggle}
      onOpenChange={(isOpen) => setIsOpen(isOpen)}
      selected={value}
      onSelect={(_, selection) => {
        onChange(selection as string);
        setIsOpen(false);
      }}
    >
      <SelectList>
        {options.map((o: SelectOptionProps, index) => (
          <SelectOption
            key={`${index}-${o.value}`}
            isSelected={o.value == value}
            {...o}
          />
        ))}
      </SelectList>
    </Select>
  );
};
