import { checkAccess } from "./common/rbac-utils";
import { isAuthRequired } from "./Constants";
import keycloak from "./keycloak";
interface IRBACProps {
  allowedPermissions: string[];
  children: any;
  rbacType: RBAC_TYPE;
}
export const RBAC = ({
  allowedPermissions,
  rbacType,
  children,
}: IRBACProps) => {
  if (isAuthRequired) {
    const token = keycloak.tokenParsed || undefined;
    if (rbacType === RBAC_TYPE.Role) {
      let userRoles = token?.realm_access?.roles,
        access = userRoles && checkAccess(userRoles, allowedPermissions);
      return access && children;
    } else if (rbacType === RBAC_TYPE.Scope) {
      const userScopes: string[] = token?.scope.split(" ");
      const access = userScopes && checkAccess(userScopes, allowedPermissions);

      return access && children;
    }
  } else {
    return children;
  }
};

export enum RBAC_TYPE {
  Role = 1,
  Scope,
}

export const devRoles = ["tackle-admin", "tackle-architect", "tackle-migrator"];

export const adminRoles = ["tackle-admin"];

export const legacyPathfinderRoles = ["admin", "user"];

export const readScopes = [
  "addons:get",
  "applications:get",
  "businessservices:get",
  "dependencies:get",
  "identities:get",
  "imports:get",
  "jobFunctions:get",
  "proxies:get",
  "reviews:get",
  "settings:get",
  "stakeholdergroups:get",
  "stakeholders:get",
  "tags:get",
  "tagtypes:get",
  "tasks:get",
];

export const writeScopes = [
  "addons:post",
  "addons:put",
  "addons:delete",
  "applications:put",
  "applications:post",
  "applications:delete",
  "businessservices:put",
  "businessservices:post",
  "businessservices:delete",
  "dependencies:put",
  "dependencies:post",
  "dependencies:delete",
  "identities:put",
  "identities:post",
  "identities:delete",
  "imports:put",
  "imports:post",
  "imports:delete",
  "jobfunctions:put",
  "jobfunctions:post",
  "jobFunctions:delete",
  "proxies:put",
  "proxies:post",
  "proxies:delete",
  "reviews:put",
  "reviews:post",
  "reviews:delete",
  "settings:put",
  "settings:post",
  "settings:delete",
  "stakeholdergroups:put",
  "stakeholdergroups:post",
  "stakeholdergroups:delete",
  "stakeholders:put",
  "stakeholders:post",
  "stakeholders:delete",
  "tags:put",
  "tags:post",
  "tags:delete",
  "tagtypes:put",
  "tagtypes:post",
  "tagtypes:delete",
];

export const taskWriteScopes = ["tasks:put", "tasks:post", "tasks:delete"];
