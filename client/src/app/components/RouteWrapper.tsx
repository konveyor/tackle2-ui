import * as React from "react";
import { Redirect, Route } from "react-router-dom";

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
  const { isLoaded, realmRoles } = useAuth();

  // Still loading the OIDC session — don't redirect prematurely.
  if (!isLoaded) return null;

  // Authentication is enforced by AuthReadyGate before any routes render.
  // Here we only check role-based access control.
  const access = checkAccess(realmRoles, roles);

  if (!access) {
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
