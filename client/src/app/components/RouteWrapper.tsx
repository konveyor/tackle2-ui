import * as React from "react";
import { Navigate } from "react-router-dom";

import { isAuthRequired } from "@app/Constants";
import keycloak from "@app/keycloak";

import { checkAccess } from "../utils/rbac-utils";

interface IRouteWrapperProps {
  comp: React.ComponentType;
  roles: string[];
}

export const RouteWrapper = ({
  comp: Component,
  roles,
}: IRouteWrapperProps) => {
  const token = keycloak.tokenParsed || undefined;
  const userRoles = token?.realm_access?.roles || [],
    access = checkAccess(userRoles, roles);

  if (!token && isAuthRequired) {
    //TODO: Handle token expiry & auto logout
    return <Navigate to="/login" replace />;
  } else if (token && !access) {
    return <Navigate to="/applications" replace />;
  }

  return <Component />;
};
