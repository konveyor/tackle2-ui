import React, { lazy, Suspense } from "react";
import { Route, Switch, Redirect } from "react-router-dom";

import { AppPlaceholder } from "@app/shared/components";

import { RepositoriesGit } from "./pages/repositories/Git";
import { RepositoriesMvn } from "./pages/repositories/Mvn";
import { RepositoriesSvn } from "./pages/repositories/Svn";
import { Paths } from "@app/Paths";
import { ApplicationAssessment } from "./pages/applications/application-assessment/application-assessment";
import { RouteWrapper } from "./common/RouteWrapper";
import * as roles from "./roles";

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
  component: React.ComponentType<any>;
  exact?: boolean;
  routes?: undefined;
}

export const devRoutes: IRoute[] = [
  {
    path: Paths.applicationsImportsDetails,
    component: ImportDetails,
    exact: false,
  },
  {
    path: Paths.applicationsImports,
    component: ManageImports,
    exact: false,
  },
  {
    path: Paths.applicationsAssessment,
    component: ApplicationAssessment,
    exact: false,
  },
  {
    path: Paths.applicationsReview,
    component: Reviews,
    exact: false,
  },
  {
    path: Paths.applications,
    component: Applications,
    exact: false,
  },
  {
    path: Paths.controls,
    component: Controls,
    exact: false,
  },
  {
    path: Paths.reports,
    component: Reports,
    exact: false,
  },
];

export const adminRoutes: IRoute[] = [
  {
    component: Identities,
    path: Paths.identities,
    exact: false,
  },
  {
    component: RepositoriesGit,
    path: Paths.repositoriesGit,
    exact: false,
  },
  {
    component: RepositoriesSvn,
    path: Paths.repositoriesSvn,
    exact: false,
  },
  {
    component: RepositoriesMvn,
    path: Paths.repositoriesMvn,
    exact: false,
  },
  { component: Proxies, path: "/proxies", exact: false },
];
export const AppRoutes = () => {
  return (
    <Suspense fallback={<AppPlaceholder />}>
      <Switch>
        {devRoutes.map(({ ...props }, index) => (
          <RouteWrapper
            comp={props.component}
            key={index}
            roles={roles.devRoutes.roles}
            {...props}
          />
        ))}
        {adminRoutes.map(({ ...props }, index) => (
          <RouteWrapper
            comp={props.component}
            key={index}
            roles={roles.adminRoutes.roles}
            {...props}
          />
        ))}
        <Redirect from="/" to="/applications" exact />
      </Switch>
    </Suspense>
  );
};
