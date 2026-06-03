import * as React from "react";
import { Redirect, Route } from "react-router-dom";

import { useAuth, useHasSomeScopes } from "@app/auth";

interface IRouteWrapperProps {
  comp: React.ComponentType<Record<string, unknown>>;
  requiredScopes: string[];
  path: string;
  exact?: boolean;
}

export const RouteWrapper = ({
  comp: Component,
  requiredScopes,
  path,
  exact,
}: IRouteWrapperProps) => {
  const { isLoaded } = useAuth();
  const access = useHasSomeScopes(requiredScopes);

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
