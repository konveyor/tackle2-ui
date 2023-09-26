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

export const SSOMenu: React.FC = () => {
  const { t } = useTranslation();

  const { keycloak } = (isAuthRequired && useKeycloak()) || {};
  const history = useHistory();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const onDropdownSelect = () => {
    setIsDropdownOpen((current) => !current);
  };

  const onDropdownToggle = (isOpen: boolean) => {
    setIsDropdownOpen(isOpen);
  };
  return (
    <>
      {keycloak && (
        <ToolbarItem
          visibility={{
            default: "hidden",
            md: "visible",
          }} /** this user dropdown is hidden on mobile sizes */
        >
          <Dropdown
            isPlain
            onSelect={onDropdownSelect}
            isOpen={isDropdownOpen}
            toggle={(toggleRef) => (
              <MenuToggle
                ref={toggleRef}
                id="sso-actions-toggle"
                onClick={() => onDropdownToggle(!isDropdownOpen)}
              >
                {(keycloak?.idTokenParsed as any)["preferred_username"]}
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
                    // Clears selected persona from storage without updating it in React state so we don't re-render the persona selector while logging out.
                    // We have to clear it before logout because the redirect can happen before the logout promise resolves.
                    window.localStorage.removeItem(
                      LocalStorageKey.selectedPersona
                    );
                    {
                      keycloak
                        .logout()
                        .then((res) => {
                          history.push("/");
                        })
                        .catch((err) => {
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
      )}
    </>
  );
};
