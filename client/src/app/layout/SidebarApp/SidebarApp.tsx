import { FC, ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import {
  Nav,
  NavExpandable,
  NavItem,
  NavList,
  PageSidebar,
  PageSidebarBody,
} from "@patternfly/react-core";

import { isDevtoolsEnabled } from "@app/Constants";
import { AdminPaths, DevPaths, DevtoolPaths, UniversalPaths } from "@app/Paths";
import {
  administrationRoutes,
  devtoolRoutes,
  migrationRoutes,
  universalRoutes,
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

export const SidebarApp: React.FC = () => {
  const [lastPersona, setLastPersona] = useState<PersonaType>();
  return (
    <Routes>
      {migrationRoutes.map(({ path }, index) => (
        <Route
          path={path}
          key={index}
          element={<MigrationSidebar setLastPersona={setLastPersona} />}
        />
      ))}
      {administrationRoutes.map(({ path }, index) => (
        <Route
          path={path}
          key={index}
          element={<AdminSidebar setLastPersona={setLastPersona} />}
        />
      ))}
      {devtoolRoutes.map(({ path }, index) => (
        <Route
          path={path}
          key={index}
          element={<DevtoolSidebar setLastPersona={setLastPersona} />}
        />
      ))}
      {universalRoutes.map(({ path }, index) => (
        <Route
          path={path}
          key={index}
          element={
            lastPersona === "ADMINISTRATION" ? (
              <AdminSidebar setLastPersona={setLastPersona} />
            ) : (
              <MigrationSidebar setLastPersona={setLastPersona} />
            )
          }
        />
      ))}
    </Routes>
  );
};

const PersonaSidebar: FC<{
  children: ReactNode;
  selectedPersona: PersonaType;
  setLastPersona: (persona: PersonaType) => void;
}> = ({ children, selectedPersona, setLastPersona }) => {
  const token = keycloak.tokenParsed || undefined;
  const userRoles = token?.realm_access?.roles || [];
  const adminAccess = checkAccess(userRoles, ["tackle-admin"]);

  useEffect(() => {
    setLastPersona(selectedPersona);
  }, [selectedPersona, setLastPersona]);

  const personaOptions = [
    "MIGRATION",
    adminAccess && "ADMINISTRATION",
    isDevtoolsEnabled && "DEVTOOL",
  ].filter<PersonaType>(Boolean);

  const navigate = useNavigate();
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
              navigate(startPath);
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

export const MigrationSidebar = ({
  setLastPersona,
}: {
  setLastPersona: (persona: PersonaType) => void;
}) => {
  const { t } = useTranslation();

  return (
    <PersonaSidebar selectedPersona="MIGRATION" setLastPersona={setLastPersona}>
      <NavList title="Global">
        <NavExpandable
          title={t("sidebar.group.applications")}
          srText={t("sidebar.group.applications")}
          groupId="migration-applications"
          isExpanded
        >
          <NavItem>
            <NavLink
              to={DevPaths.applications}
              className={({ isActive }) => (isActive ? "pf-m-current" : "")}
            >
              {t("sidebar.applicationInventory")}
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              to={DevPaths.archetypes}
              className={({ isActive }) => (isActive ? "pf-m-current" : "")}
            >
              {t("sidebar.archetypes")}
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              to={DevPaths.migrationWaves}
              className={({ isActive }) => (isActive ? "pf-m-current" : "")}
            >
              {t("sidebar.migrationWaves")}
            </NavLink>
          </NavItem>
        </NavExpandable>
        <NavExpandable
          title={t("sidebar.group.analysisResults")}
          srText={t("sidebar.group.analysisResults")}
          groupId="migration-analysis-results"
          isExpanded
        >
          <NavItem>
            <NavLink
              to={DevPaths.reports}
              className={({ isActive }) => (isActive ? "pf-m-current" : "")}
            >
              {t("sidebar.reports")}
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              to={DevPaths.issuesAllTab}
              className={({ isActive }) => (isActive ? "pf-m-current" : "")}
            >
              {t("sidebar.issues")}
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              to={DevPaths.insightsAllTab}
              className={({ isActive }) => (isActive ? "pf-m-current" : "")}
            >
              {t("sidebar.insights")}
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              to={DevPaths.dependencies}
              className={({ isActive }) => (isActive ? "pf-m-current" : "")}
            >
              {t("sidebar.dependencies")}
            </NavLink>
          </NavItem>
        </NavExpandable>
        <NavExpandable
          title={t("sidebar.group.configuration")}
          srText={t("sidebar.group.configuration")}
          groupId="migration-configuration"
          isExpanded
        >
          <NavItem>
            <NavLink
              to={DevPaths.analysisProfiles}
              className={({ isActive }) => (isActive ? "pf-m-current" : "")}
            >
              {t("sidebar.analysisProfiles")}
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              to={DevPaths.controls}
              className={({ isActive }) => (isActive ? "pf-m-current" : "")}
            >
              {t("sidebar.controls")}
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              to={DevPaths.migrationTargets}
              className={({ isActive }) => (isActive ? "pf-m-current" : "")}
            >
              {t("sidebar.customMigrationTargets")}
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              to={UniversalPaths.tasks}
              className={({ isActive }) => (isActive ? "pf-m-current" : "")}
            >
              {t("sidebar.tasks")}
            </NavLink>
          </NavItem>
        </NavExpandable>
      </NavList>
    </PersonaSidebar>
  );
};

export const AdminSidebar = ({
  setLastPersona,
}: {
  setLastPersona: (persona: PersonaType) => void;
}) => {
  const { t } = useTranslation();
  return (
    <PersonaSidebar
      selectedPersona="ADMINISTRATION"
      setLastPersona={setLastPersona}
    >
      <NavList title="Admin">
        <NavItem>
          <NavLink
            to={AdminPaths.general}
            className={({ isActive }) => (isActive ? "pf-m-current" : "")}
          >
            {t("terms.general")}
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            to={AdminPaths.identities}
            className={({ isActive }) => (isActive ? "pf-m-current" : "")}
          >
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
              className={({ isActive }) => (isActive ? "pf-m-current" : "")}
            >
              Git
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              to={AdminPaths.repositoriesSvn}
              className={({ isActive }) => (isActive ? "pf-m-current" : "")}
            >
              Subversion
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              to={AdminPaths.repositoriesMvn}
              className={({ isActive }) => (isActive ? "pf-m-current" : "")}
            >
              Maven
            </NavLink>
          </NavItem>
        </NavExpandable>
        <NavItem>
          <NavLink
            to={AdminPaths.proxies}
            className={({ isActive }) => (isActive ? "pf-m-current" : "")}
          >
            Proxy
          </NavLink>
        </NavItem>
        <NavExpandable
          title="Issue management"
          srText="SR Link"
          groupId="admin-issue-management"
          isExpanded
        >
          <NavItem>
            <NavLink
              to={AdminPaths.jira}
              className={({ isActive }) => (isActive ? "pf-m-current" : "")}
            >
              Jira
            </NavLink>
          </NavItem>
        </NavExpandable>
        <NavItem>
          <NavLink
            to={AdminPaths.assessment}
            className={({ isActive }) => (isActive ? "pf-m-current" : "")}
          >
            {t("terms.assessmentQuestionnaires")}
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            to={AdminPaths.sourcePlatforms}
            className={({ isActive }) => (isActive ? "pf-m-current" : "")}
          >
            {t("terms.sourcePlatforms")}
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            to={AdminPaths.assetGenerators}
            className={({ isActive }) => (isActive ? "pf-m-current" : "")}
          >
            {t("terms.generators")}
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            to={UniversalPaths.tasks}
            className={({ isActive }) => (isActive ? "pf-m-current" : "")}
          >
            {t("sidebar.tasks")}
          </NavLink>
        </NavItem>
      </NavList>
    </PersonaSidebar>
  );
};

const DevtoolSidebar = !isDevtoolsEnabled
  ? () => null
  : ({
      setLastPersona,
    }: {
      setLastPersona: (persona: PersonaType) => void;
    }) => (
      <PersonaSidebar selectedPersona="DEVTOOL" setLastPersona={setLastPersona}>
        <NavList title="Devtool">
          <NavItem>
            <NavLink
              to={DevtoolPaths.schemaDefined}
              className={({ isActive }) => (isActive ? "pf-m-current" : "")}
            >
              SDF Playground
            </NavLink>
          </NavItem>
        </NavList>
      </PersonaSidebar>
    );
