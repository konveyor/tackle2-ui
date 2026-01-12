import { useState } from "react";
import * as React from "react";
import { useKeycloak } from "@react-keycloak/web";
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

export const SsoToolbarItem: React.FC = () => {
  return isAuthRequired ? <AuthEnabledSsoToolbarItem /> : <></>;
};

export const AuthEnabledSsoToolbarItem: React.FC = () => {
  const { t } = useTranslation();

  const { keycloak } = useKeycloak();
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
            {keycloak?.idTokenParsed?.["preferred_username"] ??
              "DefaultUsername"}
          </MenuToggle>
        )}
      >
        <DropdownGroup key="sso">
          <DropdownList>
            <DropdownItem
              id="manage-account"
              key="sso_user_management"
              component="button"
              onClick={() => keycloak.accountManagement()}
            >
              {t("actions.manageAccount")}
            </DropdownItem>
            <DropdownItem
              id="logout"
              key="sso_logout"
              onClick={() => {
                window.localStorage.removeItem(LocalStorageKey.selectedPersona);
                {
                  keycloak
                    .logout()
                    .then(() => {
                      history.push("/");
                    })
                    .catch((err) => {
                      console.error("Logout failed:", err);
                      history.push("/");
                    });
                }
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
