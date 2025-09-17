import React from "react";
import { useTranslation } from "react-i18next";
import { NavLink, Route, Switch, useHistory } from "react-router-dom";
import {
  Nav,
  NavExpandable,
  NavItem,
  NavList,
  PageSidebar,
  PageSidebarBody,
} from "@patternfly/react-core";

import { isDevtoolsEnabled } from "@app/Constants";
import { AdminPaths, DevPaths, DevtoolPaths } from "@app/Paths";
import {
  administrationRoutes,
  devtoolRoutes,
  migrationRoutes,
} from "@app/Routes";
import { SimpleSelectBasic } from "@app/components/SimpleSelectBasic";
import keycloak from "@app/keycloak";
import { checkAccess } from "@app/utils/rbac-utils";

import { LayoutTheme } from "../LayoutUtils";
import "./SidebarApp.css";

const PersonaDefinition = {
  ADMINISTRATION: {
    label: "Administration",
    startPath: AdminPaths.general,
  },
  MIGRATION: {
    label: "Migration",
    startPath: DevPaths.applications,
  },
  DEVTOOL: {
    label: "Development Tools",
    startPath: DevtoolPaths.schemaDefined,
  },
} as const;

type PersonaType = keyof typeof PersonaDefinition;

export const SidebarApp: React.FC = () => (
  <Switch>
    {migrationRoutes.map(({ path, exact }, index) => (
      <Route
        path={path}
        exact={exact}
        key={index}
        render={() => <MigrationSidebar />}
      />
    ))}
    {administrationRoutes.map(({ path, exact }, index) => (
      <Route
        path={path}
        exact={exact}
        key={index}
        render={() => <AdminSidebar />}
      />
    ))}
    {devtoolRoutes.map(({ path, exact }, index) => (
      <Route
        path={path}
        exact={exact}
        key={index}
        render={() => <DevtoolSidebar />}
      />
    ))}
  </Switch>
);

const PersonaSidebar: React.FC<{
  children: React.ReactNode;
  selectedPersona: PersonaType;
}> = ({ children, selectedPersona }) => {
  const token = keycloak.tokenParsed || undefined;
  const userRoles = token?.realm_access?.roles || [];
  const adminAccess = checkAccess(userRoles, ["tackle-admin"]);

  const personaOptions = [
    "MIGRATION",
    adminAccess && "ADMINISTRATION",
    isDevtoolsEnabled && "DEVTOOL",
  ].filter<PersonaType>(Boolean);

  const history = useHistory();
  return (
    <PageSidebar theme={LayoutTheme}>
      <div className="perspective">
        <SimpleSelectBasic
          value={selectedPersona}
          options={personaOptions.map((value) => ({
            value,
            children: PersonaDefinition[value]?.label,
          }))}
          onChange={(value) => {
            const startPath =
              PersonaDefinition[value as PersonaType]?.startPath;
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
          <NavLink to={DevPaths.applications} activeClassName="pf-m-current">
            {t("sidebar.applicationInventory")}
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink to={DevPaths.archetypes} activeClassName="pf-m-current">
            {t("sidebar.archetypes")}
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink to={DevPaths.reports} activeClassName="pf-m-current">
            {t("sidebar.reports")}
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink to={DevPaths.controls} activeClassName="pf-m-current">
            {t("sidebar.controls")}
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink to={DevPaths.migrationWaves} activeClassName="pf-m-current">
            {t("sidebar.migrationWaves")}
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink to={DevPaths.issuesAllTab} activeClassName="pf-m-current">
            {t("sidebar.issues")}
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink to={DevPaths.insightsAllTab} activeClassName="pf-m-current">
            {t("sidebar.insights")}
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink to={DevPaths.dependencies} activeClassName="pf-m-current">
            {t("sidebar.dependencies")}
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink to={DevPaths.tasks} activeClassName="pf-m-current">
            {t("sidebar.tasks")}
          </NavLink>
        </NavItem>
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
          <NavLink to={AdminPaths.general} activeClassName="pf-m-current">
            {t("terms.general")}
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink to={AdminPaths.identities} activeClassName="pf-m-current">
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
              to={AdminPaths.repositoriesGit}
              activeClassName="pf-m-current"
            >
              Git
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              to={AdminPaths.repositoriesSvn}
              activeClassName="pf-m-current"
            >
              Subversion
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              to={AdminPaths.repositoriesMvn}
              activeClassName="pf-m-current"
            >
              Maven
            </NavLink>
          </NavItem>
        </NavExpandable>
        <NavItem>
          <NavLink to={AdminPaths.proxies} activeClassName="pf-m-current">
            Proxy
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            to={AdminPaths.migrationTargets}
            activeClassName="pf-m-current"
          >
            Custom migration targets
          </NavLink>
        </NavItem>
        <NavExpandable
          title="Issue management"
          srText="SR Link"
          groupId="admin-issue-management"
          isExpanded
        >
          <NavItem>
            <NavLink to={AdminPaths.jira} activeClassName="pf-m-current">
              Jira
            </NavLink>
          </NavItem>
        </NavExpandable>
        <NavItem>
          <NavLink to={AdminPaths.assessment} activeClassName="pf-m-current">
            {t("terms.assessmentQuestionnaires")}
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            to={AdminPaths.sourcePlatforms}
            activeClassName="pf-m-current"
          >
            {t("terms.sourcePlatforms")}
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            to={AdminPaths.assetGenerators}
            activeClassName="pf-m-current"
          >
            {t("terms.generators")}
          </NavLink>
        </NavItem>
      </NavList>
    </PersonaSidebar>
  );
};

const DevtoolSidebar = !isDevtoolsEnabled
  ? () => null
  : () => (
      <PersonaSidebar selectedPersona="DEVTOOL">
        <NavList title="Devtool">
          <NavItem>
            <NavLink
              to={DevtoolPaths.schemaDefined}
              activeClassName="pf-m-current"
            >
              SDF Playground
            </NavLink>
          </NavItem>
        </NavList>
      </PersonaSidebar>
    );
