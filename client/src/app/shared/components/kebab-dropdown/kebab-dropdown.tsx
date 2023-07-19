import React, { useState } from "react";

import { Dropdown, KebabToggle } from "@patternfly/react-core/deprecated";

export interface IKebabDropdownProps {
  dropdownItems?: React.ReactNode[];
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
      toggle={<KebabToggle onToggle={(_, isOpen) => onKebabToggle(isOpen)} />}
      isOpen={isOpen}
      isPlain
      position="right"
      dropdownItems={dropdownItems}
    />
  );
};
