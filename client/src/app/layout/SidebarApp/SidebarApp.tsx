import React, { useEffect } from "react";
import { NavLink, useHistory, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Nav,
  NavItem,
  PageSidebar,
  NavList,
  NavExpandable,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectOption,
  SelectList,
} from "@patternfly/react-core";
import "./SidebarApp.css";

import { Paths } from "@app/Paths";
import { LayoutTheme } from "../LayoutUtils";
import { checkAccess } from "@app/common/rbac-utils";
import keycloak from "@app/keycloak";

import { useLocalStorage } from "@migtools/lib-ui";
import { LocalStorageKey } from "@app/Constants";
import { FEATURES_ENABLED } from "@app/FeatureFlags";

enum PersonaKey {
  ADMINISTRATION = "Administration",
  MIGRATION = "Migration",
}

export const SidebarApp: React.FC = () => {
  const token = keycloak.tokenParsed || undefined;
  const userRoles = token?.realm_access?.roles || [],
    adminAccess = checkAccess(userRoles, ["tackle-admin"]);

  const { t } = useTranslation();
  const { search } = useLocation();
  const history = useHistory();

  useEffect(() => {
    if (!selectedPersona) {
      history.push("/applications");
      setSelectedPersona(PersonaKey.MIGRATION);
    }
  }, []);

  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedPersona, setSelectedPersona] = useLocalStorage<string | null>(
    LocalStorageKey.selectedPersona,
    null
  );

  const onToggleClick = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    itemId: string | number | undefined
  ) => {
    setSelectedPersona(itemId as string);
    if (itemId === PersonaKey.ADMINISTRATION) {
      history.push(Paths.general);
    } else {
      history.push(Paths.applications);
    }
    setIsOpen(false);
  };

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={onToggleClick}
      isExpanded={isOpen}
      style={
        {
          width: "200px",
        } as React.CSSProperties
      }
    >
      {selectedPersona}
    </MenuToggle>
  );

  return (
    <PageSidebar theme={LayoutTheme}>
      <Nav id="nav-primary" aria-label="Nav" theme={LayoutTheme}>
        <div className="perspective">
          <Select
            id="sidebar-perspective"
            aria-label="Select user perspective"
            isOpen={isOpen}
            selected={selectedPersona}
            onSelect={onSelect}
            onOpenChange={(isOpen) => setIsOpen(isOpen)}
            toggle={toggle}
          >
            <SelectList>
              <SelectOption itemId={PersonaKey.MIGRATION}>
                {PersonaKey.MIGRATION}
              </SelectOption>
              <SelectOption itemId={PersonaKey.ADMINISTRATION}>
                {PersonaKey.ADMINISTRATION}
              </SelectOption>
            </SelectList>
          </Select>
        </div>
        {selectedPersona === PersonaKey.MIGRATION ? (
          <NavList title="Global">
            <NavItem>
              <NavLink
                to={Paths.applications + search}
                activeClassName="pf-v5-m-current"
              >
                {t("sidebar.applicationInventory")}
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                to={Paths.reports + search}
                activeClassName="pf-v5-m-current"
              >
                {t("sidebar.reports")}
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink to={Paths.controls} activeClassName="pf-v5-m-current">
                {t("sidebar.controls")}
              </NavLink>
            </NavItem>
            {FEATURES_ENABLED.migrationWaves ? (
              <NavItem>
                <NavLink
                  to={Paths.migrationWaves}
                  activeClassName="pf-v5-m-current"
                >
                  {t("sidebar.migrationWaves")}
                </NavLink>
              </NavItem>
            ) : null}
            {FEATURES_ENABLED.dynamicReports ? (
              <>
                <NavItem>
                  <NavLink to={Paths.issues} activeClassName="pf-v5-m-current">
                    {t("sidebar.issues")}
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    to={Paths.dependencies}
                    activeClassName="pf-v5-m-current"
                  >
                    {t("sidebar.dependencies")}
                  </NavLink>
                </NavItem>
              </>
            ) : null}
          </NavList>
        ) : (
          <NavList title="Admin">
            <NavItem>
              <NavLink to={Paths.general} activeClassName="pf-v5-m-current">
                {t("terms.general")}
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink to={Paths.identities} activeClassName="pf-v5-m-current">
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
                  activeClassName="pf-v5-m-current"
                >
                  Git
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  to={Paths.repositoriesSvn}
                  activeClassName="pf-v5-m-current"
                >
                  Subversion
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  to={Paths.repositoriesMvn}
                  activeClassName="pf-v5-m-current"
                >
                  Maven
                </NavLink>
              </NavItem>
            </NavExpandable>
            <NavItem>
              <NavLink to={Paths.proxies} activeClassName="pf-v5-m-current">
                Proxy
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                to={Paths.migrationTargets}
                activeClassName="pf-v5-m-current"
              >
                Custom migration targets
              </NavLink>
            </NavItem>
            {FEATURES_ENABLED.migrationWaves ? (
              <NavExpandable
                title="Issue management"
                srText="SR Link"
                groupId="admin-issue-management"
                isExpanded
              >
                <NavItem>
                  <NavLink to={Paths.jira} activeClassName="pf-v5-m-current">
                    Jira
                  </NavLink>
                </NavItem>
              </NavExpandable>
            ) : null}
          </NavList>
        )}
      </Nav>
    </PageSidebar>
  );
};
