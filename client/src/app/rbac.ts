/**
 * Role and scope constants for RBAC.
 *
 * The RBAC component and checkAccess utility remain here.
 *
 * Token claims are sourced from the auth module (useAuth hook).
 */

import type { ReactNode } from "react";

import { isAuthRequired } from "./Constants";
import { useAuth } from "./auth";

const checkAccess = (
  userPermissions: string[],
  allowedPermissions: string[]
) => {
  if (!isAuthRequired) return true;
  const access = userPermissions.some((userPermission) =>
    allowedPermissions.includes(userPermission)
  );
  return access;
};

interface RBACProps {
  allowedPermissions: string[];
  children: ReactNode;
  rbacType: RBAC_TYPE;
}

export enum RBAC_TYPE {
  Role = 1,
  Scope,
}

export const RBAC = ({ allowedPermissions, rbacType, children }: RBACProps) => {
  const { realmRoles, scopes } = useAuth();

  if (isAuthRequired) {
    if (rbacType === RBAC_TYPE.Role) {
      const access = checkAccess(realmRoles, allowedPermissions);
      return access && children;
    } else if (rbacType === RBAC_TYPE.Scope) {
      const access = checkAccess(scopes, allowedPermissions);
      return access && children;
    }
  } else {
    return children;
  }
};

export const devRoles = ["tackle-admin", "tackle-architect", "tackle-migrator"];

export const adminRoles = ["tackle-admin"];

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

export const credentialsReadScopes = ["identities:get"];

export const reviewsWriteScopes = [
  "reviews:put",
  "reviews:post",
  "reviews:delete",
];
export const targetsWriteScopes = [
  "targets:put",
  "targets:post",
  "targets:delete",
];
