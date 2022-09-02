import React, { useState } from "react";

import { Dropdown, KebabToggle } from "@patternfly/react-core";

export interface IKebabDropdownProps {
  dropdownItems?: any[];
}

export const KebabDropdown: React.FC<IKebabDropdownProps> = ({
  dropdownItems,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const onKebabToggle = (isOpen: boolean) => {
    setIsOpen(isOpen);
  };

  return (
    <Dropdown
      toggle={<KebabToggle onToggle={onKebabToggle} />}
      isOpen={isOpen}
      isPlain
      position="right"
      dropdownItems={dropdownItems}
    />
  );
};
