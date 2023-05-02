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

import { useLocalStorage } from "@migtools/lib-ui";
import { LocalStorageKey } from "@app/Constants";
import { FEATURES_ENABLED } from "@app/FeatureFlags";
import { OptionWithValue, SimpleSelect } from "@app/shared/components";
import { toOptionLike } from "@app/utils/model-utils";
import "./SidebarApp.css";

export const SidebarApp: React.FC = () => {
  const token = keycloak.tokenParsed || undefined;
  const userRoles = token?.realm_access?.roles || [],
    adminAccess = checkAccess(userRoles, ["tackle-admin"]);

  const { t } = useTranslation();
  const { search } = useLocation();
  const history = useHistory();
  enum PersonaKey {
    ADMINISTRATION = "Administration",
    MIGRATION = "Migration",
  }

  const options = [
    <SelectOption
      key="dev"
      component="button"
      value={PersonaKey.MIGRATION}
      isPlaceholder
    >
      {PersonaKey.MIGRATION}
    </SelectOption>,
    ...(adminAccess
      ? [
          <SelectOption
            key="admin"
            component="button"
            value={PersonaKey.ADMINISTRATION}
          >
            {PersonaKey.ADMINISTRATION}
          </SelectOption>,
        ]
      : []),
  ];

  const personaOptions: OptionWithValue<string>[] = [
    {
      value: PersonaKey.MIGRATION,
      toString: () => PersonaKey.MIGRATION,
    },
    {
      value: PersonaKey.ADMINISTRATION,
      toString: () => PersonaKey.ADMINISTRATION,
    },
  ];

  const [selectedPersona, setSelectedPersona] =
    useLocalStorage<PersonaKey | null>(LocalStorageKey.selectedPersona, null);

  useEffect(() => {
    if (!selectedPersona) {
      history.push("/applications");
      setSelectedPersona(PersonaKey.MIGRATION);
    }
  }, []);

  const Navigation = (
    <Nav id="nav-primary" aria-label="Nav" theme={LayoutTheme}>
      <div className="perspective">
        <SimpleSelect
          toggleId="sidebar-perspective-toggle"
          variant={SelectVariant.single}
          aria-label="Select user perspective"
          id="sidebar-perspective"
          value={
            selectedPersona
              ? toOptionLike(selectedPersona, personaOptions)
              : undefined
          }
          options={personaOptions}
          onChange={(selection) => {
            const selectionValue = selection as OptionWithValue<PersonaKey>;
            setSelectedPersona(selectionValue.value);
            if (selectionValue.value === PersonaKey.ADMINISTRATION) {
              history.push(Paths.general);
            } else {
              history.push(Paths.applications);
            }
          }}
        />
      </div>
      {selectedPersona === PersonaKey.MIGRATION ? (
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
          {FEATURES_ENABLED.migrationWaves ? (
            <NavItem>
              <NavLink to={Paths.waves} activeClassName="pf-m-current">
                {t("sidebar.waves")}
              </NavLink>
            </NavItem>
          ) : null}
          {FEATURES_ENABLED.dynamicReports ? (
            <>
              <NavItem>
                <NavLink to={Paths.issues} activeClassName="pf-m-current">
                  {t("sidebar.issues")}
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink to={Paths.dependencies} activeClassName="pf-m-current">
                  {t("sidebar.dependencies")}
                </NavLink>
              </NavItem>
            </>
          ) : null}
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
          {FEATURES_ENABLED.migrationWaves ? (
            <NavExpandable
              title="Issue management"
              srText="SR Link"
              groupId="admin-issue-management"
              isExpanded
            >
              <NavItem>
                <NavLink to={Paths.jira} activeClassName="pf-m-current">
                  Jira
                </NavLink>
              </NavItem>
            </NavExpandable>
          ) : null}
        </NavList>
      )}
    </Nav>
  );

  return <PageSidebar nav={Navigation} theme={LayoutTheme} />;
};
