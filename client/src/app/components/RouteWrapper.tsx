import { isAuthRequired } from "@app/Constants";
import keycloak from "@app/keycloak";
import React from "react";
import { Redirect, Route } from "react-router-dom";
import { checkAccess } from "../utils/rbac-utils";

interface IRouteWrapperProps {
  comp: React.ComponentType<any>;
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
  const token = keycloak.tokenParsed || undefined;
  let userRoles = token?.realm_access?.roles || [],
    access = checkAccess(userRoles, roles);

  if (!token && isAuthRequired) {
    //TODO: Handle token expiry & auto logout
    return <Redirect to="/login" />;
  } else if (token && !access) {
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
