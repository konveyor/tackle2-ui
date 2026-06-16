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
import { useHistory } from "react-router-dom";
import {
  Divider,
  DividerVariant,
  Dropdown,
  DropdownGroup,
  DropdownItem,
  DropdownList,
  MenuToggle,
  ToolbarItem,
} from "@patternfly/react-core";

import { LocalStorageKey } from "@app/Constants";
import { UniversalPaths } from "@app/Paths";
import { UserEditModal } from "@app/pages/user-management/users/user-modal";
import { useFetchCurrentUserAndScopes } from "@app/queries/users";
import { ScopeGate, tokensReadScopes } from "@app/scopes";

import { useAuth } from "../hooks";

export const OidcToolbarItem: React.FC = () => {
  const { t } = useTranslation();
  const { username, signOut, manageAccount } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const history = useHistory();
  const [isUserAccountOpen, setIsUserAccountOpen] = useState(false);
  const { userAndScopes } = useFetchCurrentUserAndScopes();
  const user = userAndScopes?.user;
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
              id="manage-account-local"
              key="sso_user_management_local"
              component="button"
              isDisabled={!user}
              onClick={() => setIsUserAccountOpen(true)}
            >
              {t("actions.manageAccount")}
            </DropdownItem>
            <ScopeGate requiredScopes={tokensReadScopes}>
              <DropdownItem
                id="tokens"
                key="sso_tokens"
                component="button"
                onClick={() => history.push(UniversalPaths.tokens)}
              >
                {t("sidebar.tokens")}
              </DropdownItem>
            </ScopeGate>
            {manageAccount && (
              <DropdownItem
                id="manage-account-idp"
                key="sso_user_management_idp"
                component="button"
                onClick={() => manageAccount()}
              >
                {t("actions.manageAccountViaIdP")}
              </DropdownItem>
            )}
            <Divider component={DividerVariant.li} />
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
      <UserEditModal
        user={isUserAccountOpen ? user : undefined}
        onClose={() => setIsUserAccountOpen(false)}
      />
    </ToolbarItem>
  );
};
