import { checkAccess } from "./utils/rbac-utils";
import { isAuthRequired } from "./Constants";
import keycloak from "./keycloak";
interface IRBACProps {
  allowedPermissions: string[];
  children: any;
  rbacType: RBAC_TYPE;
}

export enum RBAC_TYPE {
  Role = 1,
  Scope,
}

export const RBAC = ({
  allowedPermissions,
  rbacType,
  children,
}: IRBACProps) => {
  if (isAuthRequired) {
    const token = keycloak.tokenParsed || undefined;
    if (rbacType === RBAC_TYPE.Role) {
      let userRoles = token?.realm_access?.roles || [],
        access = checkAccess(userRoles, allowedPermissions);
      return access && children;
    } else if (rbacType === RBAC_TYPE.Scope) {
      const userScopes: string[] = token?.scope.split(" ") || [];
      const access = checkAccess(userScopes, allowedPermissions);

      return access && children;
    }
  } else {
    return children;
  }
};

export const devRoles = ["tackle-admin", "tackle-architect", "tackle-migrator"];

export const adminRoles = ["tackle-admin"];

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
  "tagcategories:get",
  "tasks:get",
];

export const adminWriteScopes = [
  "addons:post",
  "addons:put",
  "addons:delete",
  "identities:put",
  "identities:post",
  "identities:delete",
  "proxies:put",
  "proxies:post",
  "proxies:delete",
];

export const controlsWriteScopes = [
  "businessservices:put",
  "businessservices:post",
  "businessservices:delete",
  "jobfunctions:put",
  "jobfunctions:post",
  "jobFunctions:delete",
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
  "tagcategories:put",
  "tagcategories:post",
  "tagcategories:delete",
];

export const dependenciesWriteScopes = [
  "dependencies:put",
  "dependencies:post",
  "dependencies:delete",
];

export const applicationsWriteScopes = [
  "applications:put",
  "applications:post",
  "applications:delete",
];

export const modifiedPathfinderWriteScopes = [
  "assessments:put",
  "assessments:patch",
  "assessments:delete",
];

export const importsWriteScopes = [
  "imports:put",
  "imports:post",
  "imports:delete",
];

export const tasksReadScopes = ["tasks:get", "taskgroups:get"];

export const tasksWriteScopes = [
  "tasks:post",
  "tasks:put",
  "tasks:delete",
  "taskgroups:post",
  "taskgroups:put",
  "taskgroups:delete",
];
