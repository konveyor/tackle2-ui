import React from "react";
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
import AdminIcon from "@patternfly/react-icons/dist/esm/icons/cogs-icon";
import DevIcon from "@patternfly/react-icons/dist/esm/icons/code-icon";

import { Paths } from "@app/Paths";
import { LayoutTheme } from "../LayoutUtils";
import "./SidebarApp.css";
import { checkAccess } from "@app/common/rbac-utils";
import keycloak from "@app/keycloak";

export const SidebarApp: React.FC = () => {
  const token = keycloak.tokenParsed || undefined;
  const userRoles = token?.realm_access?.roles,
    adminAccess = userRoles && checkAccess(userRoles, ["tackle-admin"]);

  const { t } = useTranslation();
  const { search } = useLocation();
  const history = useHistory();

  const onAdminClick = () => {
    console.log("Admin Selected");
  };

  const onDevClick = () => {
    console.log("Dev Selected");
  };

  const options = [
    <SelectOption
      key="dev"
      component="button"
      onClick={onDevClick}
      value="Developer"
      isPlaceholder
    />,
    ...(adminAccess
      ? [
          <SelectOption
            key="admin"
            component="button"
            onClick={onAdminClick}
            value="Administrator"
          />,
        ]
      : []),
  ];

  const [isOpen, setIsOpen] = React.useState(false);
  const [selected, setSelected] = React.useState("Developer");
  const [isDevIcon, setDevIcon] = React.useState(true);

  const Navigation = (
    <>
      <Select
        toggleIcon={isDevIcon ? <DevIcon /> : <AdminIcon />}
        className="perspective"
        variant={SelectVariant.single}
        aria-label="Select user perspective"
        selections={selected}
        isOpen={isOpen}
        onSelect={(_, selection) => {
          setSelected(selection as string);
          setIsOpen(!isOpen);
          if (selection === "Administrator") {
            setDevIcon(false);
            history.push(Paths.identities);
          } else {
            setDevIcon(true);
            history.push(Paths.applications);
          }
        }}
        onToggle={() => {
          setIsOpen(!isOpen);
        }}
      >
        {options}
      </Select>
      {selected === "Developer" ? (
        <Nav id="nav-primary" aria-label="Nav" theme={LayoutTheme}>
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
              <NavLink
                to={Paths.reports + search}
                activeClassName="pf-m-current"
              >
                {t("sidebar.reports")}
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink to={Paths.controls} activeClassName="pf-m-current">
                {t("sidebar.controls")}
              </NavLink>
            </NavItem>
          </NavList>
        </Nav>
      ) : (
        <Nav id="nav-admin" aria-label="NavAdmin" theme={LayoutTheme}>
          <NavList title="Admin">
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
          </NavList>
        </Nav>
      )}
    </>
  );

  return <PageSidebar nav={Navigation} theme={LayoutTheme} />;
};
