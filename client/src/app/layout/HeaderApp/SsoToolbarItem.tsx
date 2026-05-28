import { useState } from "react";
import * as React from "react";
import { useTranslation } from "react-i18next";
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
 * Show user menu for authenticated users, or the masquerade dev panel for development.
 *
 * - AUTH_REQUIRED=true                              → real username + logout/manage-account menu
 * - AUTH_REQUIRED=false + NODE_ENV=development      → MasqueradeDevPanel (role switcher)
 * - AUTH_REQUIRED=false + NODE_ENV=production       → nothing (user pinned to admin roles)
 *
 * The NODE_ENV check uses process.env.NODE_ENV so webpack can replace it with the
 * literal string "production" at build time and tree-shake the dev panel out of
 * production bundles entirely.
 */
export const SsoToolbarItem: React.FC = () => {
  if (isAuthRequired) {
    return <AuthEnabledSsoToolbarItem />;
  }
  if (process.env.NODE_ENV !== "production") {
    return <MasqueradeDevPanel />;
  }
  // Production no-auth mode: no switcher, no user menu, default to admin roles.
  return null;
};

export const AuthEnabledSsoToolbarItem: React.FC = () => {
  const { t } = useTranslation();
  const { username, signOut, manageAccount } = useAuth();
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
        popperProps={{ position: "end" }}
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
