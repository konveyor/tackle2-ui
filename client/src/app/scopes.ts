/**
 * Scope constants and the ScopeGate component for scope-based access control.
 *
 * All permission checks in the UI are scope-based, aligned with the OAuth2
 * scopes provisioned by the hub in Keycloak (resource:verb pairs).
 *
 * Source of truth for hub scopes: @app/auth/roles-to-scopes.ts
 */

import type { ReactNode } from "react";

import { useHasSomeScopes } from "./auth";

interface ScopeGateProps {
  requiredScopes: string[];
  children: ReactNode;
}

/**
 * Renders children only when the current user has at least one of the
 * required scopes. Returns null otherwise.
 */
export const ScopeGate = ({
  requiredScopes,
  children,
}: ScopeGateProps): ReactNode => {
  const hasAccess = useHasSomeScopes(requiredScopes);
  return hasAccess ? children : null;
};

// ---------------------------------------------------------------------------
// Scope constant groups — imported by pages and components that need to gate
// specific actions. Use with ScopeGate or useHasSomeScopes / useHasAllScopes.
// ---------------------------------------------------------------------------

export const controlsWriteScopes = [
  "businessservices:put",
  "businessservices:post",
  "businessservices:delete",
  "jobfunctions:put",
  "jobfunctions:post",
  "jobfunctions:delete",
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

export const analysisProfileWriteScopes = [
  "analysis.profiles:put",
  "analysis.profiles:post",
  "analysis.profiles:delete",
];

export const analysesReadScopes = ["applications.analyses:get"];

/** Scopes for creating/deleting assessments on applications and archetypes. */
export const assessmentWriteScopes = [
  "applications.assessments:post",
  "archetypes.assessments:post",
  "assessments:put",
  "assessments:delete",
];

export const importsWriteScopes = [
  "imports:put",
  "imports:post",
  "imports:delete",
];

export const tasksReadScopes = ["tasks:get"];

export const tasksWriteScopes = [
  "tasks:post",
  "tasks:put",
  "tasks:patch",
  "tasks:delete",
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

export const migrationWaveWriteScopes = [
  "migrationwaves:put",
  "migrationwaves:post",
  "migrationwaves:delete",
];

export const questionnaireWriteScopes = [
  "questionnaires:put",
  "questionnaires:post",
  "questionnaires:delete",
];

export const trackerWriteScopes = [
  "trackers:put",
  "trackers:post",
  "trackers:delete",
];

export const settingsWriteScopes = [
  "settings:put",
  "settings:post",
  "settings:delete",
];
