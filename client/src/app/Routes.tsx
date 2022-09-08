import React, { lazy, Suspense } from "react";
import { Route, Switch, Redirect } from "react-router-dom";

import { AppPlaceholder } from "@app/shared/components";

import { RepositoriesGit } from "./pages/repositories/Git";
import { RepositoriesMvn } from "./pages/repositories/Mvn";
import { RepositoriesSvn } from "./pages/repositories/Svn";
import { Paths } from "@app/Paths";
import { ApplicationAssessment } from "./pages/applications/application-assessment/application-assessment";
import { RouteWrapper } from "./common/RouteWrapper";
import { adminRoles, devRoles } from "./rbac";

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
];

export const adminRoutes: IRoute[] = [
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
];
export const AppRoutes = () => {
  return (
    <Suspense fallback={<AppPlaceholder />}>
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
    </Suspense>
  );
};
