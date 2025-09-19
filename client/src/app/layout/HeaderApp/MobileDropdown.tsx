import React, { useState } from "react";
import { DropdownItem } from "@patternfly/react-core";
import HelpIcon from "@patternfly/react-icons/dist/esm/icons/help-icon";

import { KebabDropdown } from "@app/components/KebabDropdown";
import { AppAboutModal } from "@app/layout/AppAboutModal";

export const MobileDropdown: React.FC = () => {
  const [isAboutModalOpen, setAboutModalOpen] = useState(false);

  const toggleAboutModal = () => {
    setAboutModalOpen((current) => !current);
  };

  return (
    <>
      <KebabDropdown
        ariaLabel="mobile dropdown"
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
