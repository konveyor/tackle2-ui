import { ENV } from "@app/Constants";
import keycloak from "@app/keycloak";
import React from "react";
import { Redirect, Route } from "react-router-dom";
import { checkAccess } from "./rbac-utils";

interface IRouteWrapperProps {
  comp: React.ComponentType<any>;
  roles: string[];
}

export const RouteWrapper = ({
  comp: Component,
  roles,
  ...rest
}: IRouteWrapperProps) => {
  const token = keycloak.tokenParsed || undefined;
  let userRoles = token?.realm_access?.roles,
    access = userRoles && checkAccess(userRoles, roles);

  const isAuthRequired = ENV.AUTH_REQUIRED !== "false";

  if (!token && isAuthRequired) {
    //TODO: Handle token expiry & auto logout
    return <Redirect to="/login" />;
  } else if (token && !access && isAuthRequired) {
    return <Redirect to="/" />;
  }

  return <Route {...rest} render={(props) => <Component {...props} />} />;
};
