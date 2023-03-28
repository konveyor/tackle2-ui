import React, { lazy, Suspense } from "react";
import { Switch, Redirect, useLocation } from "react-router-dom";

import { AppPlaceholder } from "@app/shared/components";

import { RepositoriesGit } from "./pages/repositories/Git";
import { RepositoriesMvn } from "./pages/repositories/Mvn";
import { RepositoriesSvn } from "./pages/repositories/Svn";
import { Paths } from "@app/Paths";
import { ApplicationAssessment } from "./pages/applications/application-assessment/application-assessment";
import { RouteWrapper } from "./common/RouteWrapper";
import { adminRoles, devRoles } from "./rbac";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from "@app/common/ErrorFallback";

const Applications = lazy(() => import("./pages/applications"));
const ManageImports = lazy(() => import("./pages/applications/manage-imports"));
const ImportDetails = lazy(
  () => import("./pages/applications/manage-imports-details")
);

const Reviews = lazy(() => import("./pages/applications/application-review"));
const Reports = lazy(() => import("./pages/reports"));
const Controls = lazy(() => import("./pages/controls"));
const Identities = lazy(() => import("./pages/identities"));
const Proxies = lazy(() => import("./pages/proxies"));
const MigrationTargets = lazy(() => import("./pages/migration-targets"));
const General = lazy(() => import("./pages/general"));
const Waves = lazy(() => import("./pages/waves"));
const Jira = lazy(() => import("./pages/jira-trackers"));

export interface IRoute {
  path: string;
  comp: React.ComponentType<any>;
  exact?: boolean;
  routes?: undefined;
}

export const devRoutes: IRoute[] = [
  {
    path: Paths.applicationsImportsDetails,
    comp: ImportDetails,
    exact: false,
  },
  {
    path: Paths.applicationsImports,
    comp: ManageImports,
    exact: false,
  },
  {
    path: Paths.applicationsAssessment,
    comp: ApplicationAssessment,
    exact: false,
  },
  {
    path: Paths.applicationsReview,
    comp: Reviews,
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
    path: Paths.waves,
    comp: Waves,
    exact: false,
  },
];

export const adminRoutes: IRoute[] = [
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
  { comp: Proxies, path: "/proxies", exact: false },
  { comp: MigrationTargets, path: "/migration-targets", exact: false },
  {
    comp: Jira,
    path: Paths.jira,
    exact: false,
  },
];
export const AppRoutes = () => {
  const location = useLocation();

  return (
    <Suspense fallback={<AppPlaceholder />}>
      <ErrorBoundary FallbackComponent={ErrorFallback} key={location.pathname}>
        <Switch>
          {devRoutes.map(({ ...props }, index) => (
            <RouteWrapper
              comp={props.comp}
              key={index}
              roles={devRoles}
              path={props.path}
              exact={props.exact}
            />
          ))}
          {adminRoutes.map(({ ...props }, index) => (
            <RouteWrapper
              comp={props.comp}
              key={index}
              roles={adminRoles}
              path={props.path}
              exact={props.exact}
            />
          ))}
          <Redirect from="*" to="/applications" />
        </Switch>
      </ErrorBoundary>
    </Suspense>
  );
};
