import { type ComponentType, Suspense, lazy } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import {
  AdminPathValues,
  DevPathValues,
  DevtoolPathValues,
  DevtoolPaths,
  Paths,
  UniversalPathValues,
} from "@app/Paths";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ErrorFallback } from "@app/components/ErrorFallback";

import { isAgenticEnabled, isDevtoolsEnabled } from "./Constants";
import { adminViewScopes, migrationViewScopes } from "./auth/roles-to-scopes";
import { RouteWrapper } from "./components/RouteWrapper";
import { RepositoriesGit } from "./pages/repositories/Git";
import { RepositoriesMvn } from "./pages/repositories/Mvn";
import { RepositoriesSvn } from "./pages/repositories/Svn";
import { RolesPage } from "./pages/user-management/roles/roles";
import { ScopesPage } from "./pages/user-management/scopes/scopes";
import { TokensPage } from "./pages/user-management/tokens/tokens";
import { UsersPage } from "./pages/user-management/users/users";

const Review = lazy(() => import("./pages/review/review-page"));
const AssessmentSettings = lazy(
  () =>
    import(
      "./pages/assessment-management/assessment-settings/assessment-settings-page"
    )
);
const Applications = lazy(() => import("./pages/applications"));
const ManageImports = lazy(() => import("./pages/applications/manage-imports"));
const ImportDetails = lazy(
  () => import("./pages/applications/manage-imports-details")
);
const AnalysisDetails = lazy(
  () => import("./pages/applications/analysis-details")
);
const Reports = lazy(() => import("./pages/reports"));
const Controls = lazy(() => import("./pages/controls"));
const Identities = lazy(() => import("./pages/identities"));
const Proxies = lazy(() => import("./pages/proxies"));
const MigrationTargets = lazy(() => import("./pages/migration-targets"));
const General = lazy(() => import("./pages/general"));
const MigrationWaves = lazy(() => import("./pages/migration-waves"));
const Jira = lazy(() => import("./pages/external/jira"));
const Issues = lazy(() => import("./pages/issues/issues-page"));
const IssuesAffectedApplications = lazy(
  () => import("./pages/issues/affected-applications-page")
);
const Insights = lazy(() => import("./pages/insights/insights-page"));
const InsightsAffectedApplications = lazy(
  () => import("./pages/insights/affected-applications-page")
);
const Dependencies = lazy(() => import("./pages/dependencies"));

const Questionnaire = lazy(
  () => import("./pages/assessment-management/questionnaire/questionnaire-page")
);

const ViewArchetypes = lazy(
  () =>
    import("./pages/assessment/components/view-archetypes/view-archetypes-page")
);
const AssessmentActions = lazy(
  () =>
    import(
      "./pages/assessment/components/assessment-actions/assessment-actions-page"
    )
);
const Archetypes = lazy(() => import("./pages/archetypes/archetypes-page"));
const TargetProfilesPage = lazy(
  () => import("./pages/archetypes/target-profiles-page")
);

const AssessmentSummary = lazy(
  () =>
    import(
      "./pages/assessment/components/assessment-summary/assessment-summary-page"
    )
);

const TaskManager = lazy(() => import("./pages/tasks/tasks-page"));
const TaskDetails = lazy(() => import("./pages/tasks/TaskDetails"));
const AnalysisProfiles = lazy(() => import("./pages/analysis-profiles"));
const SourcePlatforms = lazy(
  () => import("./pages/source-platforms/source-platforms")
);

const AssetGenerators = lazy(
  () => import("./pages/asset-generators/asset-generators")
);

const AgentRuns = lazy(() => import("./pages/agent-runs"));
const AgentRunDetails = lazy(
  () => import("./pages/agent-runs/agent-run-detail-page")
);
const Agents = lazy(() => import("./pages/agents"));
const Skills = lazy(() => import("./pages/skills"));
const Workflows = lazy(() => import("./pages/workflows"));
const WorkflowRuns = lazy(() => import("./pages/workflow-runs"));
const Gateways = lazy(() => import("./pages/gateways"));
const WorkflowRunDetails = lazy(
  () => import("./pages/workflow-runs/workflow-run-detail-page")
);

export interface IRoute<T extends string = string> {
  path: T | `${T}/*`;
  comp: ComponentType;
}

export const migrationRoutes: IRoute<DevPathValues>[] = [
  { path: Paths.applicationsImportsDetails, comp: ImportDetails },
  { path: Paths.applicationsAnalysisDetails, comp: AnalysisDetails },
  { path: Paths.applicationsTaskDetails, comp: TaskDetails },
  { path: Paths.applicationsAnalysisDetailsAttachment, comp: AnalysisDetails },
  { path: Paths.applicationsImports, comp: ManageImports },
  { path: Paths.archetypeReview, comp: Review },
  { path: Paths.applicationsReview, comp: Review },
  { path: Paths.applicationAssessmentActions, comp: AssessmentActions },
  { path: Paths.archetypeAssessmentActions, comp: AssessmentActions },
  { path: Paths.viewArchetypes, comp: ViewArchetypes },
  { path: Paths.applicationAssessmentSummary, comp: AssessmentSummary },
  { path: Paths.archetypeAssessmentSummary, comp: AssessmentSummary },
  { path: Paths.applications, comp: Applications },
  { path: `${Paths.controls}/*`, comp: Controls },
  { path: Paths.reports, comp: Reports },
  { path: Paths.migrationWaves, comp: MigrationWaves },
  {
    path: Paths.issuesAllAffectedApplications,
    comp: IssuesAffectedApplications,
  },
  { path: Paths.issuesAllTab, comp: Issues },
  { path: Paths.issuesSingleAppTab, comp: Issues },
  { path: Paths.issuesSingleAppSelected, comp: Issues },
  { path: Paths.issues, comp: Issues },
  {
    path: Paths.insightsAllAffectedApplications,
    comp: InsightsAffectedApplications,
  },
  { path: Paths.insightsAllTab, comp: Insights },
  { path: Paths.insightsSingleAppTab, comp: Insights },
  { path: Paths.insightsSingleAppSelected, comp: Insights },
  { path: Paths.insights, comp: Insights },
  { path: Paths.dependencies, comp: Dependencies },
  { path: Paths.archetypeTargetProfiles, comp: TargetProfilesPage },
  { path: Paths.archetypes, comp: Archetypes },
  { path: Paths.migrationTargets, comp: MigrationTargets },
  { path: Paths.analysisProfiles, comp: AnalysisProfiles },
];

/**
 * The agentic console. Registered only when AGENTIC_ENABLED opts the
 * deployment in — its pages talk to the hub's `/hub/agentic/*` endpoints, and
 * without that backend every page in this section fails on load, so a
 * deployment that has none gets no routes at all rather than routes that
 * error.
 */
export const agenticRoutes: IRoute<DevPathValues>[] = isAgenticEnabled
  ? [
      { path: Paths.agentRunDetails, comp: AgentRunDetails },
      { path: Paths.agentRuns, comp: AgentRuns },
      { path: Paths.agents, comp: Agents },
      { path: Paths.skills, comp: Skills },
      { path: Paths.workflows, comp: Workflows },
      { path: Paths.workflowRunDetails, comp: WorkflowRunDetails },
      { path: Paths.workflowRuns, comp: WorkflowRuns },
      { path: Paths.gateways, comp: Gateways },
    ]
  : [];

export const universalRoutes: IRoute<UniversalPathValues>[] = [
  { path: Paths.tasks, comp: TaskManager },
  { path: Paths.taskDetails, comp: TaskDetails },
  { path: Paths.taskDetailsAttachment, comp: TaskDetails },
  { comp: TokensPage, path: Paths.tokens },
];

export const administrationRoutes: IRoute<AdminPathValues>[] = [
  { comp: General, path: Paths.general },
  { comp: Identities, path: Paths.identities },
  { comp: RepositoriesGit, path: Paths.repositoriesGit },
  { comp: RepositoriesSvn, path: Paths.repositoriesSvn },
  { comp: RepositoriesMvn, path: Paths.repositoriesMvn },
  { path: Paths.assessment, comp: AssessmentSettings },
  { path: Paths.questionnaire, comp: Questionnaire },
  { comp: Proxies, path: Paths.proxies },
  { comp: Jira, path: Paths.jira },
  { comp: SourcePlatforms, path: Paths.sourcePlatforms },
  { comp: AssetGenerators, path: Paths.assetGenerators },
  { comp: UsersPage, path: Paths.users },
  { comp: RolesPage, path: Paths.roles },
  { comp: ScopesPage, path: Paths.scopes },
];

export const devtoolRoutes: IRoute<DevtoolPathValues>[] = isDevtoolsEnabled
  ? [
      {
        comp: lazy(
          () => import("./devtools/schema-defined/schema-defined-page")
        ),
        path: DevtoolPaths.schemaDefined,
      },
    ]
  : [];

export const AppRoutes = () => {
  const location = useLocation();

  return (
    <Suspense fallback={<AppPlaceholder />}>
      <ErrorBoundary FallbackComponent={ErrorFallback} key={location.pathname}>
        <Routes>
          {[...migrationRoutes, ...agenticRoutes, ...universalRoutes].map(
            ({ comp, path }, index) => (
              <Route
                key={index}
                path={path}
                element={
                  <RouteWrapper
                    comp={comp}
                    requiredScopes={migrationViewScopes}
                  />
                }
              />
            )
          )}
          {administrationRoutes.map(({ comp, path }, index) => (
            <Route
              key={index}
              path={path}
              element={
                <RouteWrapper comp={comp} requiredScopes={adminViewScopes} />
              }
            />
          ))}
          {devtoolRoutes.map(({ comp, path }, index) => (
            <Route
              key={index}
              path={path}
              element={
                <RouteWrapper
                  comp={comp}
                  requiredScopes={migrationViewScopes}
                />
              }
            />
          ))}
          <Route
            path="*"
            element={<Navigate to={Paths.applications} replace />}
          />
        </Routes>
      </ErrorBoundary>
    </Suspense>
  );
};
