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
      const userRoles = token?.realm_access?.roles || [],
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

export const archetypesWriteScopes = [
  "archetypes:put",
  "archetypes:post",
  "archetypes:delete",
];

export const analysesReadScopes = ["applications.analyses:get"];

export const assessmentWriteScopes = [
  "applications.assessments:put",
  "applications.assessments:post",
  "applications.assessments:delete",
  "archetypes.assessments:put",
  "archetypes.assessments:post",
  "archetypes.assessments:delete",
];
export const assessmentReadScopes = [
  "applications.assessments:get",
  "archetypes.assessments:get",
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

export const credentialsWriteScopes = [
  "identities:put",
  "identities:post",
  "identities:delete",
];
export const credentialsReadScopes = ["identities:get"];

export const reviewsWriteScopes = [
  "reviews:put",
  "reviews:post",
  "reviews:delete",
];
export const reviewsReadScopes = ["reviews:get"];
