import { ComponentType, Suspense, lazy } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Redirect, Switch, useLocation } from "react-router-dom";

import {
  AdminPathValues,
  DevPathValues,
  DevtoolPathValues,
  DevtoolPaths,
  Paths,
} from "@app/Paths";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ErrorFallback } from "@app/components/ErrorFallback";

import { isDevtoolsEnabled } from "./Constants";
import { RouteWrapper } from "./components/RouteWrapper";
import { RepositoriesGit } from "./pages/repositories/Git";
import { RepositoriesMvn } from "./pages/repositories/Mvn";
import { RepositoriesSvn } from "./pages/repositories/Svn";
import { adminRoles, devRoles } from "./rbac";

const Review = lazy(() => import("./pages/review/review-page"));
const AssessmentSettings = lazy(
  () =>
    import("./pages/assessment-management/assessment-settings/assessment-settings-page")
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
    import("./pages/assessment/components/assessment-actions/assessment-actions-page")
);
const Archetypes = lazy(() => import("./pages/archetypes/archetypes-page"));
const TargetProfilesPage = lazy(
  () => import("./pages/archetypes/target-profiles-page")
);

const AssessmentSummary = lazy(
  () =>
    import("./pages/assessment/components/assessment-summary/assessment-summary-page")
);

const TaskManager = lazy(() => import("./pages/tasks/tasks-page"));
const TaskDetails = lazy(() => import("./pages/tasks/TaskDetails"));
const SourcePlatforms = lazy(
  () => import("./pages/source-platforms/source-platforms")
);

const AssetGenerators = lazy(
  () => import("./pages/asset-generators/asset-generators")
);

export interface IRoute<T> {
  path: T;
  comp: ComponentType;
  exact?: boolean;
}

export const migrationRoutes: IRoute<DevPathValues>[] = [
  {
    path: Paths.applicationsImportsDetails,
    comp: ImportDetails,
    exact: false,
  },
  {
    path: Paths.applicationsAnalysisDetails,
    comp: AnalysisDetails,
    exact: true,
  },
  {
    path: Paths.applicationsTaskDetails,
    comp: TaskDetails,
    exact: true,
  },
  {
    path: Paths.applicationsAnalysisDetailsAttachment,
    comp: AnalysisDetails,
    exact: false,
  },
  {
    path: Paths.applicationsImports,
    comp: ManageImports,
    exact: false,
  },
  {
    path: Paths.archetypeReview,
    comp: Review,
    exact: false,
  },
  {
    path: Paths.applicationsReview,
    comp: Review,
    exact: false,
  },
  {
    path: Paths.applicationAssessmentActions,
    comp: AssessmentActions,
    exact: false,
  },
  {
    path: Paths.archetypeAssessmentActions,
    comp: AssessmentActions,
    exact: false,
  },
  {
    path: Paths.viewArchetypes,
    comp: ViewArchetypes,
    exact: false,
  },
  {
    path: Paths.applicationAssessmentSummary,
    comp: AssessmentSummary,
    exact: false,
  },
  {
    path: Paths.archetypeAssessmentSummary,
    comp: AssessmentSummary,
    exact: false,
  },
  {
    path: Paths.applications,
    comp: Applications,
    exact: false,
  },
  {
    path: Paths.controls,
    comp: Controls,
    exact: false,
  },
  {
    path: Paths.reports,
    comp: Reports,
    exact: false,
  },
  {
    path: Paths.migrationWaves,
    comp: MigrationWaves,
    exact: false,
  },
  {
    path: Paths.issuesAllAffectedApplications,
    comp: IssuesAffectedApplications,
    exact: false,
  },
  {
    path: Paths.issuesAllTab,
    comp: Issues,
    exact: false,
  },
  {
    path: Paths.issuesSingleAppTab,
    comp: Issues,
    exact: false,
  },
  {
    path: Paths.issuesSingleAppSelected,
    comp: Issues,
    exact: false,
  },
  {
    path: Paths.issues,
    comp: Issues,
    exact: false,
  },
  {
    path: Paths.insightsAllAffectedApplications,
    comp: InsightsAffectedApplications,
    exact: false,
  },
  {
    path: Paths.insightsAllTab,
    comp: Insights,
    exact: false,
  },
  {
    path: Paths.insightsSingleAppTab,
    comp: Insights,
    exact: false,
  },
  {
    path: Paths.insightsSingleAppSelected,
    comp: Insights,
    exact: false,
  },
  {
    path: Paths.insights,
    comp: Insights,
    exact: false,
  },
  {
    path: Paths.dependencies,
    comp: Dependencies,
    exact: false,
  },
  // Target profiles route must come before archetypes route due to route matching order
  {
    path: Paths.archetypeTargetProfiles,
    comp: TargetProfilesPage,
    exact: false,
  },
  {
    path: Paths.archetypes,
    comp: Archetypes,
    exact: false,
  },
  {
    path: Paths.tasks,
    comp: TaskManager,
    exact: true,
  },
  {
    path: Paths.taskDetails,
    comp: TaskDetails,
    exact: true,
  },
  {
    path: Paths.taskDetailsAttachment,
    comp: TaskDetails,
    exact: false,
  },
];

export const administrationRoutes: IRoute<AdminPathValues>[] = [
  {
    comp: General,
    path: Paths.general,
    exact: false,
  },
  {
    comp: Identities,
    path: Paths.identities,
    exact: false,
  },
  {
    comp: RepositoriesGit,
    path: Paths.repositoriesGit,
    exact: false,
  },
  {
    comp: RepositoriesSvn,
    path: Paths.repositoriesSvn,
    exact: false,
  },
  {
    comp: RepositoriesMvn,
    path: Paths.repositoriesMvn,
    exact: false,
  },
  {
    path: Paths.assessment,
    comp: AssessmentSettings,
    exact: false,
  },
  {
    path: Paths.questionnaire,
    comp: Questionnaire,
    exact: false,
  },
  { comp: Proxies, path: Paths.proxies, exact: false },
  { comp: MigrationTargets, path: Paths.migrationTargets, exact: false },
  {
    comp: Jira,
    path: Paths.jira,
    exact: false,
  },
  {
    comp: SourcePlatforms,
    path: Paths.sourcePlatforms,
    exact: false,
  },
  {
    comp: AssetGenerators,
    path: Paths.assetGenerators,
    exact: false,
  },
];

export const devtoolRoutes: IRoute<DevtoolPathValues>[] = isDevtoolsEnabled
  ? [
      {
        comp: lazy(
          () => import("./devtools/schema-defined/schema-defined-page")
        ),
        path: DevtoolPaths.schemaDefined,
        exact: false,
      },
    ]
  : [];

export const AppRoutes = () => {
  const location = useLocation();

  return (
    <Suspense fallback={<AppPlaceholder />}>
      <ErrorBoundary FallbackComponent={ErrorFallback} key={location.pathname}>
        <Switch>
          {migrationRoutes.map(({ comp, path, exact }, index) => (
            <RouteWrapper
              comp={comp}
              key={index}
              roles={devRoles}
              path={path}
              exact={exact}
            />
          ))}
          {administrationRoutes.map(({ comp, path, exact }, index) => (
            <RouteWrapper
              comp={comp}
              key={index}
              roles={adminRoles}
              path={path}
              exact={exact}
            />
          ))}
          {devtoolRoutes.map(({ comp, path, exact }, index) => (
            <RouteWrapper
              comp={comp}
              key={index}
              roles={devRoles}
              path={path}
              exact={exact}
            />
          ))}
          <Redirect from="*" to="/applications" />
        </Switch>
      </ErrorBoundary>
    </Suspense>
  );
};
