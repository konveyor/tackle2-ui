import React, { useState } from "react";

import {
  Select,
  SelectList,
  SelectOption,
  MenuToggle,
  MenuToggleElement,
} from "@patternfly/react-core";

export interface ISimpleSelectBasicProps {
  onChange: (selection: string) => void;
  options: string[];
  value?: string;
  placeholderText?: string;
}

export const SimpleSelectBasic: React.FC<ISimpleSelectBasicProps> = ({
  onChange,
  options,
  value,
  placeholderText = "Select...",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      isFullWidth
      ref={toggleRef}
      onClick={() => {
        setIsOpen(!isOpen);
      }}
      isExpanded={isOpen}
    >
      {value || placeholderText || ""}
    </MenuToggle>
  );

  return (
    <Select
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
        {options.map((option, index) => (
          <SelectOption key={`${index}-${option.toString()}`} value={option}>
            {option.toString()}
          </SelectOption>
        ))}
      </SelectList>
    </Select>
  );
};
