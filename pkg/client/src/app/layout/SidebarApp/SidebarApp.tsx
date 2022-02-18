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

export const SidebarApp: React.FC = () => {
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
    <SelectOption
      key="admin"
      component="button"
      onClick={onAdminClick}
      value="Administrator"
    />,
  ];

  const [isOpen, setIsOpen] = React.useState(false);
  const [selected, setSelected] = React.useState("Developer");
  const [isDevIcon, setDevIcon] = React.useState(true);

  const onTogglePerspective = () => {
    setIsOpen(!isOpen);
  };

  const onSelectPerspective = (_, selection) => {
    setSelected(selection);
    setIsOpen(!isOpen);
    if (selection === "Administrator") {
      setDevIcon(false);
      history.push(Paths.identities);
    } else {
      setDevIcon(true);
      history.push(Paths.applications);
    }
  };

  const Navigation2 = (
    <Nav id="nav-primary-simple" theme="dark">
      <NavList id="nav-list-simple">
        {/* {routes.map(
          (route, idx) =>
            route.label && (!route.routes ? renderNavItem(route, idx) : renderNavGroup(route, idx))
        )} */}
      </NavList>
    </Nav>
  );

  const Navigation = (
    <>
      <Select
        toggleIcon={isDevIcon ? <DevIcon /> : <AdminIcon />}
        className="perspective"
        variant={SelectVariant.single}
        aria-label="Select user perspective"
        selections={selected}
        isOpen={isOpen}
        onSelect={onSelectPerspective}
        onToggle={onTogglePerspective}
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
