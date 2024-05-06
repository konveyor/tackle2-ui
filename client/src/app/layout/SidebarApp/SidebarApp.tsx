import React, { FC } from "react";
import { NavLink, Route, Switch, useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Nav,
  NavItem,
  PageSidebar,
  NavList,
  NavExpandable,
  PageSidebarBody,
} from "@patternfly/react-core";

import { Paths } from "@app/Paths";
import { LayoutTheme } from "../LayoutUtils";
import { checkAccess } from "@app/utils/rbac-utils";
import keycloak from "@app/keycloak";

import { FEATURES_ENABLED } from "@app/FeatureFlags";
import { SimpleSelectBasic } from "@app/components/SimpleSelectBasic";
import "./SidebarApp.css";
import { ReactElement } from "react-markdown/lib/react-markdown";
import { adminRoutes, devRoutes } from "@app/Routes";

type PersonaType = "ADMINISTRATION" | "MIGRATION";

const PersonaKey: {
  [key in PersonaType]: { label: string; startPath: Paths };
} = {
  ADMINISTRATION: {
    label: "Administration",
    startPath: Paths.general,
  },
  MIGRATION: {
    label: "Migration",
    startPath: Paths.applications,
  },
};

export const SidebarApp: React.FC = () => (
  <Switch>
    {devRoutes.map(({ path, exact }, index) => (
      <Route
        path={path}
        exact={exact}
        key={index}
        render={() => <MigrationSidebar />}
      />
    ))}
    {adminRoutes.map(({ path, exact }, index) => (
      <Route
        path={path}
        exact={exact}
        key={index}
        render={() => <AdminSidebar />}
      />
    ))}
  </Switch>
);

const PersonaSidebar: FC<{
  children: ReactElement;
  selectedPersona: PersonaType;
}> = ({ children, selectedPersona }) => {
  const token = keycloak.tokenParsed || undefined;
  const userRoles = token?.realm_access?.roles || [];
  const adminAccess = checkAccess(userRoles, ["tackle-admin"]);

  const personaOptions: PersonaType[] = [
    "MIGRATION",
    adminAccess && "ADMINISTRATION",
  ].filter(Boolean);

  const history = useHistory();
  return (
    <PageSidebar theme={LayoutTheme}>
      <div className="perspective">
        <SimpleSelectBasic
          value={selectedPersona}
          options={personaOptions.map((value) => ({
            value,
            children: PersonaKey[value]?.label,
          }))}
          onChange={(value) => {
            const startPath = PersonaKey[value as PersonaType]?.startPath;
            if (value !== selectedPersona && startPath) {
              history.push(startPath);
            }
          }}
        />
      </div>
      <PageSidebarBody>
        <Nav id="nav-primary" aria-label="Nav" theme={LayoutTheme}>
          {children}
        </Nav>
      </PageSidebarBody>
    </PageSidebar>
  );
};

export const MigrationSidebar = () => {
  const { t } = useTranslation();
  return (
    <PersonaSidebar selectedPersona="MIGRATION">
      <NavList title="Global">
        <NavItem>
          <NavLink to={Paths.applications} activeClassName="pf-m-current">
            {t("sidebar.applicationInventory")}
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink to={Paths.archetypes} activeClassName="pf-m-current">
            {t("sidebar.archetypes")}
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink to={Paths.reports} activeClassName="pf-m-current">
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
            <NavLink to={Paths.migrationWaves} activeClassName="pf-m-current">
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
              <NavLink to={Paths.dependencies} activeClassName="pf-m-current">
                {t("sidebar.dependencies")}
              </NavLink>
            </NavItem>
          </>
        ) : null}
      </NavList>
    </PersonaSidebar>
  );
};

export const AdminSidebar = () => {
  const { t } = useTranslation();
  return (
    <PersonaSidebar selectedPersona="ADMINISTRATION">
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
            <NavLink to={Paths.repositoriesGit} activeClassName="pf-m-current">
              Git
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to={Paths.repositoriesSvn} activeClassName="pf-m-current">
              Subversion
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to={Paths.repositoriesMvn} activeClassName="pf-m-current">
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
        <NavItem>
          <NavLink to={Paths.assessment} activeClassName="pf-m-current">
            {t("terms.assessmentQuestionnaires")}
          </NavLink>
        </NavItem>
      </NavList>
    </PersonaSidebar>
  );
};
