import React, { lazy, Suspense } from "react";
import { Switch, Redirect, useLocation } from "react-router-dom";

import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { RepositoriesGit } from "./pages/repositories/Git";
import { RepositoriesMvn } from "./pages/repositories/Mvn";
import { RepositoriesSvn } from "./pages/repositories/Svn";
import { Paths, DevPathValues, AdminPathValues } from "@app/Paths";
import { RouteWrapper } from "./components/RouteWrapper";
import { adminRoles, devRoles } from "./rbac";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from "@app/components/ErrorFallback";
import { FEATURES_ENABLED } from "./FeatureFlags";

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
const Issues = lazy(() => import("./pages/issues"));
const AffectedApplications = lazy(
  () => import("./pages/issues/affected-applications")
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

const AssessmentSummary = lazy(
  () =>
    import(
      "./pages/assessment/components/assessment-summary/assessment-summary-page"
    )
);

const TaskManager = lazy(() => import("./pages/tasks/tasks-page"));
const TaskDetails = lazy(() => import("./pages/tasks/TaskDetails"));

export interface IRoute<T> {
  path: T;
  comp: React.ComponentType<any>;
  exact?: boolean;
  routes?: undefined;
}

export const devRoutes: IRoute<DevPathValues>[] = [
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
  ...(FEATURES_ENABLED.migrationWaves
    ? [
        {
          path: Paths.migrationWaves,
          comp: MigrationWaves,
          exact: false,
        },
      ]
    : []),
  ...(FEATURES_ENABLED.dynamicReports
    ? [
        {
          path: Paths.issuesAllAffectedApplications,
          comp: AffectedApplications,
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
          path: Paths.dependencies,
          comp: Dependencies,
          exact: false,
        },
      ]
    : []),
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

export const adminRoutes: IRoute<AdminPathValues>[] = [
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
  ...(FEATURES_ENABLED.migrationWaves
    ? [
        {
          comp: Jira,
          path: Paths.jira,
          exact: false,
        },
      ]
    : []),
];

export const AppRoutes = () => {
  const location = useLocation();

  return (
    <Suspense fallback={<AppPlaceholder />}>
      <ErrorBoundary FallbackComponent={ErrorFallback} key={location.pathname}>
        <Switch>
          {devRoutes.map(({ comp, path, exact }, index) => (
            <RouteWrapper
              comp={comp}
              key={index}
              roles={devRoles}
              path={path}
              exact={exact}
            />
          ))}
          {adminRoutes.map(({ comp, path, exact }, index) => (
            <RouteWrapper
              comp={comp}
              key={index}
              roles={adminRoles}
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
