import React, { useEffect } from "react";
import { NavLink, useHistory, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Nav,
  NavItem,
  PageSidebar,
  NavList,
  NavExpandable,
  PageSidebarBody,
  SelectOptionProps,
} from "@patternfly/react-core";

import { Paths } from "@app/Paths";
import { LayoutTheme } from "../LayoutUtils";
import { checkAccess } from "@app/utils/rbac-utils";
import keycloak from "@app/keycloak";

import { useLocalStorage } from "@migtools/lib-ui";
import { LocalStorageKey } from "@app/Constants";
import { FEATURES_ENABLED } from "@app/FeatureFlags";
import { SimpleSelectBasic } from "@app/components/SimpleSelectBasic";
import "./SidebarApp.css";

export const SidebarApp: React.FC = () => {
  const token = keycloak.tokenParsed || undefined;
  const userRoles = token?.realm_access?.roles || [],
    adminAccess = checkAccess(userRoles, ["tackle-admin"]);

  const { t } = useTranslation();
  const { search } = useLocation();
  const history = useHistory();
  const PersonaKey = {
    ADMINISTRATION: "Administration",
    MIGRATION: "Migration",
  };

  const personaOptions: SelectOptionProps[] = [
    { value: PersonaKey.MIGRATION, children: PersonaKey.MIGRATION },
    adminAccess && {
      value: PersonaKey.ADMINISTRATION,
      children: PersonaKey.ADMINISTRATION,
    },
  ].filter(Boolean);

  const [selectedPersona, setSelectedPersona] = useLocalStorage<string | null>({
    key: LocalStorageKey.selectedPersona,
    defaultValue: null,
  });

  useEffect(() => {
    if (!selectedPersona) {
      history.push("/applications");
      setSelectedPersona(PersonaKey.MIGRATION);
    }
  }, []);

  return (
    <PageSidebar theme={LayoutTheme}>
      <div className="perspective">
        <SimpleSelectBasic
          value={selectedPersona || undefined}
          options={personaOptions}
          onChange={(selection) => {
            const selectionValue = selection;
            setSelectedPersona(selectionValue);
            if (selectionValue === PersonaKey.ADMINISTRATION) {
              history.push(Paths.general);
            } else {
              history.push(Paths.applications);
            }
          }}
        />
      </div>
      <PageSidebarBody>
        <Nav id="nav-primary" aria-label="Nav" theme={LayoutTheme}>
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
                <NavLink
                  to={Paths.archetypes + search}
                  activeClassName="pf-m-current"
                >
                  {t("sidebar.archetypes")}
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
              {FEATURES_ENABLED.migrationWaves ? (
                <NavItem>
                  <NavLink
                    to={Paths.migrationWaves}
                    activeClassName="pf-m-current"
                  >
                    {t("sidebar.migrationWaves")}
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
                    <NavLink
                      to={Paths.dependencies}
                      activeClassName="pf-m-current"
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
                <NavLink
                  to={Paths.migrationTargets}
                  activeClassName="pf-m-current"
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
                    <NavLink to={Paths.jira} activeClassName="pf-m-current">
                      Jira
                    </NavLink>
                  </NavItem>
                </NavExpandable>
              ) : null}
              <NavItem>
                <NavLink to={Paths.assessment} activeClassName="pf-m-current">
                  {t("terms.assessmentQuestionnaires")}
                </NavLink>
              </NavItem>
            </NavList>
          )}
        </Nav>
      </PageSidebarBody>
    </PageSidebar>
  );
};
