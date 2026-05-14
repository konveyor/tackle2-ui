import * as React from "react";
import { Redirect, Route } from "react-router-dom";

import { isAuthRequired } from "@app/Constants";
import { useAuth } from "@app/auth";

import { checkAccess } from "../utils/rbac-utils";

interface IRouteWrapperProps {
  comp: React.ComponentType<Record<string, unknown>>;
  roles: string[];
  path: string;
  exact?: boolean;
}

export const RouteWrapper = ({
  comp: Component,
  roles,
  path,
  exact,
}: IRouteWrapperProps) => {
  const { isAuthenticated, isLoaded, realmRoles } = useAuth();

  // Still loading the OIDC session — don't redirect prematurely.
  if (!isLoaded) return null;

  const access = checkAccess(realmRoles, roles);

  if (!isAuthenticated && isAuthRequired) {
    // Not signed in — redirect to login (OIDC provider handles the actual login page).
    return <Redirect to="/login" />;
  } else if (isAuthenticated && !access) {
    return <Redirect to="/applications" />;
  }

  return (
    <Route
      path={path}
      exact={exact}
      render={(props) => <Component {...props} />}
    />
  );
};
