import React, { useEffect } from "react";
import { NavLink, useHistory, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Nav,
  NavItem,
  PageSidebar,
  NavList,
  Select,
  SelectOption,
  SelectVariant,
  NavExpandable,
} from "@patternfly/react-core";

import { Paths } from "@app/Paths";
import { LayoutTheme } from "../LayoutUtils";
import { checkAccess } from "@app/common/rbac-utils";
import keycloak from "@app/keycloak";

import "./SidebarApp.css";
import { useLocalStorage } from "@migtools/lib-ui";
import { LocalStorageKey } from "@app/Constants";

export const SidebarApp: React.FC = () => {
  const token = keycloak.tokenParsed || undefined;
  const userRoles = token?.realm_access?.roles || [],
    adminAccess = checkAccess(userRoles, ["tackle-admin"]);

  const { t } = useTranslation();
  const { search } = useLocation();
  const history = useHistory();

  const options = [
    <SelectOption key="dev" component="button" value="Developer" isPlaceholder>
      {t("sidebar.developer")}
    </SelectOption>,
    ...(adminAccess
      ? [
          <SelectOption key="admin" component="button" value="Administrator">
            {t("sidebar.administrator")}
          </SelectOption>,
        ]
      : []),
  ];

  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedPersona, setSelectedPersona] = useLocalStorage<string | null>(
    LocalStorageKey.selectedPersona,
    null
  );

  useEffect(() => {
    if (!selectedPersona) {
      history.push("/applications");
      setSelectedPersona("Developer");
    }
  }, []);

  const Navigation = (
    <Nav id="nav-primary" aria-label="Nav" theme={LayoutTheme}>
      <div className="perspective">
        <Select
          toggleId="sidebar-perspective-toggle"
          variant={SelectVariant.single}
          aria-label="Select user perspective"
          selections={selectedPersona || undefined}
          isOpen={isOpen}
          onSelect={(_, selection) => {
            setSelectedPersona(selection as string);
            setIsOpen(!isOpen);
            if (selection === "Administrator") {
              history.push(Paths.identities);
            } else {
              history.push(Paths.applications);
            }
          }}
          onToggle={() => {
            setIsOpen(!isOpen);
          }}
        >
          {options}
        </Select>
      </div>
      {selectedPersona === "Developer" ? (
        <NavList title="Global">
          <NavItem>
            <NavLink
              to={Paths.applications + search}
              activeClassName="pf-m-current"
            >
              {t("sidebar.applicationInventory")}
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to={Paths.reports + search} activeClassName="pf-m-current">
              {t("sidebar.reports")}
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to={Paths.controls} activeClassName="pf-m-current">
              {t("sidebar.controls")}
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to={Paths.waves} activeClassName="pf-m-current">
              {t("sidebar.waves")}
            </NavLink>
          </NavItem>
        </NavList>
      ) : (
        <NavList title="Admin">
          <NavItem>
            <NavLink to={Paths.general} activeClassName="pf-m-current">
              {t("terms.general")}
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to={Paths.identities} activeClassName="pf-m-current">
              {t("terms.credentials")}
            </NavLink>
          </NavItem>
          <NavExpandable
            title="Repositories"
            srText="SR Link"
            groupId="admin-repos"
            isExpanded
          >
            <NavItem>
              <NavLink
                to={Paths.repositoriesGit}
                activeClassName="pf-m-current"
              >
                Git
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                to={Paths.repositoriesSvn}
                activeClassName="pf-m-current"
              >
                Subversion
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                to={Paths.repositoriesMvn}
                activeClassName="pf-m-current"
              >
                Maven
              </NavLink>
            </NavItem>
          </NavExpandable>
          <NavItem>
            <NavLink to={Paths.proxies} activeClassName="pf-m-current">
              Proxy
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to={Paths.migrationTargets} activeClassName="pf-m-current">
              Custom migration targets
            </NavLink>
          </NavItem>
        </NavList>
      )}
    </Nav>
  );

  return <PageSidebar nav={Navigation} theme={LayoutTheme} />;
};
