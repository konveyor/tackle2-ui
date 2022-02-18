import React, { useState } from "react";
import { Dropdown, DropdownItem, KebabToggle } from "@patternfly/react-core";
import { HelpIcon } from "@patternfly/react-icons/dist/esm/icons/help-icon";
import { AppAboutModal } from "../AppAboutModal";

export const MobileDropdown: React.FC = () => {
  const [isKebabDropdownOpen, setIsKebabDropdownOpen] = useState(false);
  const [isAboutModalOpen, setAboutModalOpen] = useState(false);

  const onKebabDropdownToggle = (isOpen: boolean) => {
    setIsKebabDropdownOpen(isOpen);
  };
  const onKebabDropdownSelect = () => {
    setIsKebabDropdownOpen((current) => !current);
  };

  const toggleAboutModal = () => {
    setAboutModalOpen((current) => !current);
  };

  return (
    <>
      <Dropdown
        isPlain
        position="right"
        onSelect={onKebabDropdownSelect}
        toggle={<KebabToggle onToggle={onKebabDropdownToggle} />}
        isOpen={isKebabDropdownOpen}
        dropdownItems={[
          <DropdownItem key="about" onClick={toggleAboutModal}>
            <HelpIcon />
            &nbsp;About
          </DropdownItem>,
        ]}
      />
      <AppAboutModal isOpen={isAboutModalOpen} onClose={toggleAboutModal} />
    </>
  );
};
