import * as React from "react";
import { Redirect, Route } from "react-router-dom";

import { useAuth, useHasRealmRoles } from "@app/auth";

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
  const { isLoaded } = useAuth();
  const access = useHasRealmRoles(roles);

  // Still loading the OIDC session — don't redirect prematurely.
  if (!isLoaded) return null;

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
