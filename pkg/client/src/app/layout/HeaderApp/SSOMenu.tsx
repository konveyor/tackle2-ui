import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useKeycloak } from "@react-keycloak/web";
import {
  Dropdown,
  DropdownGroup,
  DropdownItem,
  DropdownToggle,
  PageHeaderToolsItem,
} from "@patternfly/react-core";
import { LocalStorageKey } from "@app/context/LocalStorageContext";

export const SSOMenu: React.FC = () => {
  const { t } = useTranslation();

  const { keycloak } = useKeycloak();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const onDropdownSelect = () => {
    setIsDropdownOpen((current) => !current);
  };

  const onDropdownToggle = (isOpen: boolean) => {
    setIsDropdownOpen(isOpen);
  };
  return (
    <PageHeaderToolsItem
      visibility={{
        default: "hidden",
        md: "visible",
      }} /** this user dropdown is hidden on mobile sizes */
    >
      {keycloak && (
        <Dropdown
          isPlain
          position="right"
          onSelect={onDropdownSelect}
          isOpen={isDropdownOpen}
          toggle={
            <DropdownToggle onToggle={onDropdownToggle}>
              {(keycloak.idTokenParsed as any)["preferred_username"]}
            </DropdownToggle>
          }
          dropdownItems={[
            <DropdownGroup key="sso">
              <DropdownItem
                key="sso_user_management"
                component="button"
                onClick={() => keycloak.accountManagement()}
              >
                {t("actions.manageAccount")}
              </DropdownItem>
              <DropdownItem
                key="sso_logout"
                onClick={() => {
                  // Clears selected persona from storage without updating it in React state so we don't re-render the persona selector while logging out.
                  // We have to clear it before logout because the redirect can happen before the logout promise resolves.
                  window.localStorage.removeItem(
                    LocalStorageKey.selectedPersona
                  );
                  keycloak.logout();
                }}
              >
                {t("actions.logout")}
              </DropdownItem>
            </DropdownGroup>,
          ]}
        />
      )}
    </PageHeaderToolsItem>
  );
};
