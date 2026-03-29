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

const isNavItemActive = (toPathname: string) => {
  const locationPathname = location.pathname;
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

  return (
    <PersonaSidebar selectedPersona="MIGRATION" setLastPersona={setLastPersona}>
      <NavList title="Global">
        <NavExpandable
          title={t("sidebar.group.applications")}
          srText={t("sidebar.group.applications")}
          groupId="migration-applications"
          isExpanded
        >
          <NavItem isActive={isNavItemActive(DevPaths.applications)}>
            <NavLink to={DevPaths.applications}>
              {t("sidebar.applicationInventory")}
            </NavLink>
          </NavItem>
          <NavItem isActive={isNavItemActive(DevPaths.archetypes)}>
            <NavLink to={DevPaths.archetypes}>
              {t("sidebar.archetypes")}
            </NavLink>
          </NavItem>
          <NavItem isActive={isNavItemActive(DevPaths.migrationWaves)}>
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
          <NavItem isActive={isNavItemActive(DevPaths.reports)}>
            <NavLink to={DevPaths.reports}>{t("sidebar.reports")}</NavLink>
          </NavItem>
          <NavItem
            isActive={
              isNavItemActive(DevPaths.issuesAllTab) ||
              isNavItemActive(DevPaths.issuesSingleAppTab)
            }
          >
            <NavLink to={DevPaths.issuesAllTab}>{t("sidebar.issues")}</NavLink>
          </NavItem>
          <NavItem
            isActive={
              isNavItemActive(DevPaths.insightsAllTab) ||
              isNavItemActive(DevPaths.insightsSingleAppTab)
            }
          >
            <NavLink to={DevPaths.insightsAllTab}>
              {t("sidebar.insights")}
            </NavLink>
          </NavItem>
          <NavItem isActive={isNavItemActive(DevPaths.dependencies)}>
            <NavLink to={DevPaths.dependencies}>
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
          <NavItem isActive={isNavItemActive(DevPaths.analysisProfiles)}>
            <NavLink to={DevPaths.analysisProfiles}>
              {t("sidebar.analysisProfiles")}
            </NavLink>
          </NavItem>
          <NavItem isActive={isNavItemActive(DevPaths.controls)}>
            <NavLink to={DevPaths.controls}>{t("sidebar.controls")}</NavLink>
          </NavItem>
          <NavItem isActive={isNavItemActive(DevPaths.migrationTargets)}>
            <NavLink to={DevPaths.migrationTargets}>
              {t("sidebar.customMigrationTargets")}
            </NavLink>
          </NavItem>
          <NavItem isActive={isNavItemActive(UniversalPaths.tasks)}>
            <NavLink to={UniversalPaths.tasks}>{t("sidebar.tasks")}</NavLink>
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
        <NavItem isActive={isNavItemActive(AdminPaths.general)}>
          <NavLink to={AdminPaths.general}>{t("terms.general")}</NavLink>
        </NavItem>
        <NavItem isActive={isNavItemActive(AdminPaths.identities)}>
          <NavLink to={AdminPaths.identities}>{t("terms.credentials")}</NavLink>
        </NavItem>
        <NavExpandable
          title="Repositories"
          srText="SR Link"
          groupId="admin-repos"
          isExpanded
        >
          <NavItem isActive={isNavItemActive(AdminPaths.repositoriesGit)}>
            <NavLink to={AdminPaths.repositoriesGit}>Git</NavLink>
          </NavItem>
          <NavItem isActive={isNavItemActive(AdminPaths.repositoriesSvn)}>
            <NavLink to={AdminPaths.repositoriesSvn}>Subversion</NavLink>
          </NavItem>
          <NavItem isActive={isNavItemActive(AdminPaths.repositoriesMvn)}>
            <NavLink to={AdminPaths.repositoriesMvn}>Maven</NavLink>
          </NavItem>
        </NavExpandable>
        <NavItem isActive={isNavItemActive(AdminPaths.proxies)}>
          <NavLink to={AdminPaths.proxies}>Proxy</NavLink>
        </NavItem>
        <NavExpandable
          title="Issue management"
          srText="SR Link"
          groupId="admin-issue-management"
          isExpanded
        >
          <NavItem isActive={isNavItemActive(AdminPaths.jira)}>
            <NavLink to={AdminPaths.jira}>Jira</NavLink>
          </NavItem>
        </NavExpandable>
        <NavItem isActive={isNavItemActive(AdminPaths.assessment)}>
          <NavLink to={AdminPaths.assessment}>
            {t("terms.assessmentQuestionnaires")}
          </NavLink>
        </NavItem>
        <NavItem isActive={isNavItemActive(AdminPaths.sourcePlatforms)}>
          <NavLink to={AdminPaths.sourcePlatforms}>
            {t("terms.sourcePlatforms")}
          </NavLink>
        </NavItem>
        <NavItem isActive={isNavItemActive(AdminPaths.assetGenerators)}>
          <NavLink to={AdminPaths.assetGenerators}>
            {t("terms.generators")}
          </NavLink>
        </NavItem>
        <NavItem isActive={isNavItemActive(UniversalPaths.tasks)}>
          <NavLink to={UniversalPaths.tasks}>{t("sidebar.tasks")}</NavLink>
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
          <NavItem isActive={isNavItemActive(DevtoolPaths.schemaDefined)}>
            <NavLink to={DevtoolPaths.schemaDefined}>SDF Playground</NavLink>
          </NavItem>
        </NavList>
      </PersonaSidebar>
    );
