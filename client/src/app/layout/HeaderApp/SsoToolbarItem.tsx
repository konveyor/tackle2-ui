import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useKeycloak } from "@react-keycloak/web";
import {
  Dropdown,
  MenuToggle,
  DropdownGroup,
  DropdownItem,
  DropdownList,
  ToolbarItem,
} from "@patternfly/react-core";
import { isAuthRequired, LocalStorageKey } from "@app/Constants";
import { useHistory } from "react-router-dom";

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
