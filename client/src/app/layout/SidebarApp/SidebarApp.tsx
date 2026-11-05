import { FC, ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
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

const isNavItemActive = (locationPathname: string, toPathname: string) => {
  const endSlashPosition =
    toPathname !== "/" && toPathname.endsWith("/")
      ? toPathname.length - 1
      : toPathname.length;
  return (
    locationPathname === toPathname ||
    (locationPathname.startsWith(toPathname) &&
      locationPathname.charAt(endSlashPosition) === "/")
  );
};

export const MigrationSidebar = ({
  setLastPersona,
}: {
  setLastPersona: (persona: PersonaType) => void;
}) => {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return (
    <PersonaSidebar selectedPersona="MIGRATION" setLastPersona={setLastPersona}>
      <NavList title="Global">
        <NavExpandable
          title={t("sidebar.group.applications")}
          srText={t("sidebar.group.applications")}
          groupId="migration-applications"
          isExpanded
        >
          <NavItem isActive={isNavItemActive(pathname, DevPaths.applications)}>
            <NavLink to={DevPaths.applications}>
              {t("sidebar.applicationInventory")}
            </NavLink>
          </NavItem>
          <NavItem isActive={isNavItemActive(pathname, DevPaths.archetypes)}>
            <NavLink to={DevPaths.archetypes}>
              {t("sidebar.archetypes")}
            </NavLink>
          </NavItem>
          <NavItem
            isActive={isNavItemActive(pathname, DevPaths.migrationWaves)}
          >
            <NavLink to={DevPaths.migrationWaves}>
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
          <NavItem isActive={isNavItemActive(pathname, DevPaths.reports)}>
            <NavLink to={DevPaths.reports}>{t("sidebar.reports")}</NavLink>
          </NavItem>
          <NavItem isActive={isNavItemActive(pathname, DevPaths.issues)}>
            <NavLink to={DevPaths.issuesAllTab}>{t("sidebar.issues")}</NavLink>
          </NavItem>
          <NavItem isActive={isNavItemActive(pathname, DevPaths.insights)}>
            <NavLink to={DevPaths.insightsAllTab}>
              {t("sidebar.insights")}
            </NavLink>
          </NavItem>
          <NavItem isActive={isNavItemActive(pathname, DevPaths.dependencies)}>
            <NavLink to={DevPaths.dependencies}>
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
            <NavItem isActive={isNavItemActive(pathname, DevPaths.agentRuns)}>
              <NavLink to={DevPaths.agentRuns}>
                {t("sidebar.agentRuns")}
              </NavLink>
            </NavItem>
            <NavItem isActive={isNavItemActive(pathname, DevPaths.agents)}>
              <NavLink to={DevPaths.agents}>{t("sidebar.agents")}</NavLink>
            </NavItem>
            <NavItem isActive={isNavItemActive(pathname, DevPaths.skills)}>
              <NavLink to={DevPaths.skills}>{t("sidebar.skills")}</NavLink>
            </NavItem>
            <NavItem isActive={isNavItemActive(pathname, DevPaths.workflows)}>
              <NavLink to={DevPaths.workflows}>
                {t("sidebar.workflows")}
              </NavLink>
            </NavItem>
            <NavItem
              isActive={isNavItemActive(pathname, DevPaths.workflowRuns)}
            >
              <NavLink to={DevPaths.workflowRuns}>
                {t("sidebar.workflowRuns")}
              </NavLink>
            </NavItem>
            <NavItem isActive={isNavItemActive(pathname, DevPaths.gateways)}>
              <NavLink to={DevPaths.gateways}>{t("sidebar.gateways")}</NavLink>
            </NavItem>
          </NavExpandable>
        )}
        <NavExpandable
          title={t("sidebar.group.configuration")}
          srText={t("sidebar.group.configuration")}
          groupId="migration-configuration"
          isExpanded
        >
          <NavItem
            isActive={isNavItemActive(pathname, DevPaths.analysisProfiles)}
          >
            <NavLink to={DevPaths.analysisProfiles}>
              {t("sidebar.analysisProfiles")}
            </NavLink>
          </NavItem>
          <NavItem isActive={isNavItemActive(pathname, DevPaths.controls)}>
            <NavLink to={DevPaths.controls}>{t("sidebar.controls")}</NavLink>
          </NavItem>
          <NavItem
            isActive={isNavItemActive(pathname, DevPaths.migrationTargets)}
          >
            <NavLink to={DevPaths.migrationTargets}>
              {t("sidebar.customMigrationTargets")}
            </NavLink>
          </NavItem>
          <NavItem isActive={isNavItemActive(pathname, UniversalPaths.tasks)}>
            <NavLink to={UniversalPaths.tasks}>{t("sidebar.tasks")}</NavLink>
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
  const { pathname } = useLocation();
  return (
    <PersonaSidebar
      selectedPersona="ADMINISTRATION"
      setLastPersona={setLastPersona}
    >
      <NavList title="Admin">
        <NavItem isActive={isNavItemActive(pathname, AdminPaths.general)}>
          <NavLink to={AdminPaths.general}>{t("terms.general")}</NavLink>
        </NavItem>
        <NavItem isActive={isNavItemActive(pathname, AdminPaths.identities)}>
          <NavLink to={AdminPaths.identities}>{t("terms.credentials")}</NavLink>
        </NavItem>
        <NavExpandable
          title="Repositories"
          srText="SR Link"
          groupId="admin-repos"
          isExpanded
        >
          <NavItem
            isActive={isNavItemActive(pathname, AdminPaths.repositoriesGit)}
          >
            <NavLink to={AdminPaths.repositoriesGit}>Git</NavLink>
          </NavItem>
          <NavItem
            isActive={isNavItemActive(pathname, AdminPaths.repositoriesSvn)}
          >
            <NavLink to={AdminPaths.repositoriesSvn}>Subversion</NavLink>
          </NavItem>
          <NavItem
            isActive={isNavItemActive(pathname, AdminPaths.repositoriesMvn)}
          >
            <NavLink to={AdminPaths.repositoriesMvn}>Maven</NavLink>
          </NavItem>
        </NavExpandable>
        <NavItem isActive={isNavItemActive(pathname, AdminPaths.proxies)}>
          <NavLink to={AdminPaths.proxies}>Proxy</NavLink>
        </NavItem>
        <NavExpandable
          title="Issue management"
          srText="SR Link"
          groupId="admin-issue-management"
          isExpanded
        >
          <NavItem isActive={isNavItemActive(pathname, AdminPaths.jira)}>
            <NavLink to={AdminPaths.jira}>Jira</NavLink>
          </NavItem>
        </NavExpandable>
        <NavItem isActive={isNavItemActive(pathname, AdminPaths.assessment)}>
          <NavLink to={AdminPaths.assessment}>
            {t("terms.assessmentQuestionnaires")}
          </NavLink>
        </NavItem>
        <NavItem
          isActive={isNavItemActive(pathname, AdminPaths.sourcePlatforms)}
        >
          <NavLink to={AdminPaths.sourcePlatforms}>
            {t("terms.sourcePlatforms")}
          </NavLink>
        </NavItem>
        <NavItem
          isActive={isNavItemActive(pathname, AdminPaths.assetGenerators)}
        >
          <NavLink to={AdminPaths.assetGenerators}>
            {t("terms.generators")}
          </NavLink>
        </NavItem>
        <NavItem isActive={isNavItemActive(pathname, UniversalPaths.tasks)}>
          <NavLink to={UniversalPaths.tasks}>{t("sidebar.tasks")}</NavLink>
        </NavItem>
        <NavExpandable
          title={t("sidebar.group.userManagement")}
          srText={t("sidebar.group.userManagement")}
          groupId="admin-user-management"
          isExpanded
        >
          <NavItem isActive={isNavItemActive(pathname, AdminPaths.users)}>
            <NavLink to={AdminPaths.users}>{t("sidebar.users")}</NavLink>
          </NavItem>
          <NavItem isActive={isNavItemActive(pathname, UniversalPaths.tokens)}>
            <NavLink to={UniversalPaths.tokens}>{t("sidebar.tokens")}</NavLink>
          </NavItem>
          <NavItem isActive={isNavItemActive(pathname, AdminPaths.roles)}>
            <NavLink to={AdminPaths.roles}>{t("sidebar.roles")}</NavLink>
          </NavItem>
          <NavItem isActive={isNavItemActive(pathname, AdminPaths.scopes)}>
            <NavLink to={AdminPaths.scopes}>{t("sidebar.scopes")}</NavLink>
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
    }) => {
      const { pathname } = useLocation();
      return (
        <PersonaSidebar
          selectedPersona="DEVTOOL"
          setLastPersona={setLastPersona}
        >
          <NavList title="Devtool">
            <NavItem
              isActive={isNavItemActive(pathname, DevtoolPaths.schemaDefined)}
            >
              <NavLink to={DevtoolPaths.schemaDefined}>SDF Playground</NavLink>
            </NavItem>
          </NavList>
        </PersonaSidebar>
      );
    };
