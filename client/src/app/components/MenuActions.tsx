import React, { useState } from "react";
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
} from "@patternfly/react-core";

export interface MenuActionsProps {
  actions: { label: string; callback: () => void }[];
}

export const MenuActions: React.FC<MenuActionsProps> = ({ actions }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dropdown
      isOpen={isOpen}
      onSelect={() => {
        setIsOpen(false);
      }}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          onClick={() => setIsOpen(!isOpen)}
          isExpanded={isOpen}
        >
          Actions
        </MenuToggle>
      )}
      shouldFocusToggleOnSelect
    >
      <DropdownList>
        {actions.map((item, index) => (
          <DropdownItem key={index} onClick={item.callback}>
            {item.label}
          </DropdownItem>
        ))}
      </DropdownList>
    </Dropdown>
  );
};
