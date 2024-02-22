import React, { useState } from "react";

import {
  Dropdown,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
} from "@patternfly/react-core";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";

export interface IKebabDropdownProps {
  dropdownItems?: React.ReactNode[];
  ariaLabel?: string;
}

export const KebabDropdown: React.FC<IKebabDropdownProps> = ({
  dropdownItems,
  ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dropdown
      popperProps={{ position: "right" }}
      isOpen={isOpen}
      onOpenChange={(isOpen) => setIsOpen(isOpen)}
      shouldFocusToggleOnSelect
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          isExpanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          variant="plain"
          aria-label={ariaLabel || "Table toolbar actions kebab toggle"}
          isDisabled={!dropdownItems || dropdownItems.length === 0}
        >
          <EllipsisVIcon aria-hidden="true" />
        </MenuToggle>
      )}
    >
      <DropdownList>{dropdownItems}</DropdownList>
    </Dropdown>
  );
};
