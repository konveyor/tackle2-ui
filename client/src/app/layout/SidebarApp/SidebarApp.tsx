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

import { isAgenticEnabled, isDevtoolsEnabled } from "@app/Constants";
import { AdminPaths, DevPaths, DevtoolPaths, UniversalPaths } from "@app/Paths";
import {
  administrationRoutes,
  agenticRoutes,
  devtoolRoutes,
  migrationRoutes,
  universalRoutes,
} from "@app/Routes";
import { useHasSomeScopes } from "@app/auth";
import { adminViewScopes } from "@app/auth/roles-to-scopes";
import SimpleSelect from "@app/components/FilterToolbar/components/SimpleSelect";

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
      {agenticRoutes.map(({ path }, index) => (
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
  const adminAccess = useHasSomeScopes(adminViewScopes);

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
    <PageSidebar>
      <div className="perspective">
        <SimpleSelect
          toggleId="persona-select"
          toggleAriaLabel="Select persona dropdown"
          isFullWidth
          value={selectedPersona}
          options={personaOptions.map((value) => ({
            value,
            label: PersonaDefinition[value]?.label,
          }))}
          onSelect={(value) => {
            const startPath =
              PersonaDefinition[value as PersonaType]?.startPath;
            if (value !== selectedPersona && startPath) {
              navigate(startPath);
            }
          }}
        />
      </div>
      <PageSidebarBody>
        <Nav id="nav-primary" aria-label="Nav">
          {children}
        </Nav>
      </PageSidebarBody>
    </PageSidebar>
  );
};

const MigrationSidebar = ({
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
        {isAgenticEnabled && (
          <NavExpandable
            title={t("sidebar.agentic")}
            srText={t("sidebar.agentic")}
            groupId="migration-agentic"
            isExpanded
          >
            <NavItem>
              <NavLink
                to={DevPaths.agentRuns}
                className={({ isActive }) => (isActive ? "pf-m-current" : "")}
              >
                {t("sidebar.agentRuns")}
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                to={DevPaths.agents}
                className={({ isActive }) => (isActive ? "pf-m-current" : "")}
              >
                {t("sidebar.agents")}
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                to={DevPaths.skills}
                className={({ isActive }) => (isActive ? "pf-m-current" : "")}
              >
                {t("sidebar.skills")}
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                to={DevPaths.workflows}
                className={({ isActive }) => (isActive ? "pf-m-current" : "")}
              >
                {t("sidebar.workflows")}
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                to={DevPaths.workflowRuns}
                className={({ isActive }) => (isActive ? "pf-m-current" : "")}
              >
                {t("sidebar.workflowRuns")}
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                to={DevPaths.gateways}
                className={({ isActive }) => (isActive ? "pf-m-current" : "")}
              >
                {t("sidebar.gateways")}
              </NavLink>
            </NavItem>
          </NavExpandable>
        )}
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

const AdminSidebar = ({
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
        <NavExpandable
          title={t("sidebar.group.userManagement")}
          srText={t("sidebar.group.userManagement")}
          groupId="admin-user-management"
          isExpanded
        >
          <NavItem>
            <NavLink
              to={AdminPaths.users}
              className={({ isActive }) => (isActive ? "pf-m-current" : "")}
            >
              {t("sidebar.users")}
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              to={UniversalPaths.tokens}
              className={({ isActive }) => (isActive ? "pf-m-current" : "")}
            >
              {t("sidebar.tokens")}
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              to={AdminPaths.roles}
              className={({ isActive }) => (isActive ? "pf-m-current" : "")}
            >
              {t("sidebar.roles")}
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              to={AdminPaths.scopes}
              className={({ isActive }) => (isActive ? "pf-m-current" : "")}
            >
              {t("sidebar.scopes")}
            </NavLink>
          </NavItem>
        </NavExpandable>
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
