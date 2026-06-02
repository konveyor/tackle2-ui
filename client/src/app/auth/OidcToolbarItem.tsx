/**
 * OidcToolbarItem — user menu for live OIDC sessions.
 *
 * Renders the authenticated user's name with a dropdown offering
 * "Manage account" and "Logout" actions. Only used when the
 * OidcAuthStrategy is active (AUTH_REQUIRED === true).
 */

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

import { LocalStorageKey } from "@app/Constants";

import { useAuth } from "./hooks";

export const OidcToolbarItem: React.FC = () => {
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
            {manageAccount && (
              <DropdownItem
                id="manage-account"
                key="sso_user_management"
                component="button"
                onClick={() => manageAccount()}
              >
                {t("actions.manageAccount")}
              </DropdownItem>
            )}
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
