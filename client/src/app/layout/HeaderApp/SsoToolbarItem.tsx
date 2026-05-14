import { useState } from "react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import {
  Dropdown,
  DropdownGroup,
  DropdownItem,
  DropdownList,
  MenuToggle,
  ToolbarItem,
} from "@patternfly/react-core";

import { LocalStorageKey, isAuthRequired } from "@app/Constants";
import { MasqueradeDevPanel, useAuth } from "@app/auth";

/**
 * SsoToolbarItem
 *
 * - AUTH_REQUIRED=true  → shows the real username + logout/manage-account menu
 * - AUTH_REQUIRED=false → shows the MasqueradeDevPanel (role switcher) instead
 */
export const SsoToolbarItem: React.FC = () => {
  return isAuthRequired ? (
    <AuthEnabledSsoToolbarItem />
  ) : (
    <MasqueradeDevPanel />
  );
};

export const AuthEnabledSsoToolbarItem: React.FC = () => {
  const { t } = useTranslation();
  const { username, signOut, manageAccount } = useAuth();
  const history = useHistory();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const onDropdownSelect = () => {
    setIsDropdownOpen((current) => !current);
  };

  const onDropdownToggle = (isOpen: boolean) => {
    setIsDropdownOpen(isOpen);
  };

  return (
    <ToolbarItem>
      <Dropdown
        onSelect={onDropdownSelect}
        isOpen={isDropdownOpen}
        onOpenChange={onDropdownToggle}
        toggle={(toggleRef) => (
          <MenuToggle
            isFullHeight
            ref={toggleRef}
            id="sso-actions-toggle"
            onClick={() => onDropdownToggle(!isDropdownOpen)}
          >
            {username}
          </MenuToggle>
        )}
      >
        <DropdownGroup key="sso">
          <DropdownList>
            <DropdownItem
              id="manage-account"
              key="sso_user_management"
              component="button"
              onClick={() => manageAccount()}
            >
              {t("actions.manageAccount")}
            </DropdownItem>
            <DropdownItem
              id="logout"
              key="sso_logout"
              onClick={() => {
                window.localStorage.removeItem(LocalStorageKey.selectedPersona);
                signOut();
                history.push("/");
              }}
            >
              {t("actions.logout")}
            </DropdownItem>
          </DropdownList>
        </DropdownGroup>
      </Dropdown>
    </ToolbarItem>
  );
};
