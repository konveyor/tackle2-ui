import React, { useState } from "react";
import {
  Dropdown,
  DropdownPosition,
  DropdownToggle,
  DropdownItem,
} from "@patternfly/react-core";
import { FilterIcon } from "@patternfly/react-icons/dist/esm/icons/filter-icon";

export interface DropdownOption {
  key: string;
  name: React.ReactNode;
}

export interface SimpleFilterDropdownProps {
  label: React.ReactNode;
  options: DropdownOption[];
  onSelect: (key: DropdownOption) => void;
}

export const SimpleFilterDropdown: React.FC<SimpleFilterDropdownProps> = ({
  label,
  options,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOnSelect = () => {
    setIsOpen((current) => !current);
  };

  const handleOnToggle = (isOpen: boolean) => {
    setIsOpen(isOpen);
  };

  return (
    <Dropdown
      position={DropdownPosition.left}
      isOpen={isOpen}
      onSelect={handleOnSelect}
      toggle={
        <DropdownToggle onToggle={handleOnToggle}>
          <FilterIcon /> {label}
        </DropdownToggle>
      }
      dropdownItems={options.map((elem, index) => (
        <DropdownItem
          key={index}
          component="button"
          onClick={() => onSelect(elem)}
        >
          {elem.name}
        </DropdownItem>
      ))}
    />
  );
};
