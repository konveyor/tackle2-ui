import * as React from "react";
import { Navigate } from "react-router-dom";

import { useAuth, useHasSomeScopes } from "@app/auth";

interface IRouteWrapperProps {
  comp: React.ComponentType;
  requiredScopes: string[];
}

export const RouteWrapper = ({
  comp: Component,
  requiredScopes,
}: IRouteWrapperProps) => {
  const { isLoaded } = useAuth();
  const access = useHasSomeScopes(requiredScopes);

  // Still loading the OIDC session — don't redirect prematurely.
  if (!isLoaded) return null;

  if (!access) {
    return <Navigate to="/applications" replace />;
  }

  return <Component />;
};
