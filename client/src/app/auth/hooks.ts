/**
 * auth/hooks.ts
 *
 * The single public API for auth state and authorization checks in the application.
 *
 * All code that previously reached into `keycloak.tokenParsed` directly MUST
 * use these hooks instead. No feature code should import oidc-client-ts or
 * react-oidc-context directly.
 *
 * The hooks read from AuthStateContext (provided by AuthProvider), which is
 * populated differently depending on the auth mode:
 *   - Auth enabled:  live OIDC session data (realm roles decoded from the access token)
 *   - Auth disabled: masquerade values (synthetic roles from localStorage / env vars)
 *
 * Hooks:
 *   useAuth()            — full auth state (isLoaded, isAuthenticated, username, signIn/Out…)
 *   useHasRealmRoles()   — true if the current user has ANY of the given roles
 *   useHasScopes()       — true if the current user has ANY of the given scopes
 *   useIsArchitect()     — true if the user is an architect or admin
 */

import { useContext } from "react";

import { isAuthRequired } from "@app/Constants";

import { AuthStateContext } from "./AuthProvider";
import type { AuthState } from "./types";

// ── useAuth ───────────────────────────────────────────────────────────────────

/**
 * Returns the current auth state in a shape that abstracts over both the
 * auth-enabled (OIDC) and auth-disabled (masquerade) modes.
 *
 * All components should use this instead of reaching into oidc-client-ts directly.
 */
export const useAuth = (): AuthState => {
  const authState = useContext(AuthStateContext);
  if (!authState) {
    throw new Error(
      "useAuth() must be used within <AuthProvider>. " +
        "Ensure your component tree is wrapped with the AuthProvider from @app/auth."
    );
  }
  return authState;
};

// ── useHasRealmRoles ──────────────────────────────────────────────────────────

/**
 * Returns true when the current user has at least one of the supplied realm roles.
 *
 * When auth is disabled, masquerade roles are checked so RBAC behaves the same
 * as in a real auth-enabled deployment.
 *
 * @example
 *   const canAdmin = useHasRealmRoles(["tackle-admin"]);
 */
export const useHasRealmRoles = (roles: string[]): boolean => {
  const { realmRoles } = useAuth();
  if (!isAuthRequired) return true;
  return roles.some((r) => realmRoles.includes(r));
};

// ── useHasScopes ──────────────────────────────────────────────────────────────

/**
 * Returns true when the current user has at least one of the supplied scopes.
 *
 * When auth is disabled, always returns true (all operations permitted in dev mode).
 *
 * @example
 *   const canWrite = useHasScopes(applicationsWriteScopes);
 */
export const useHasScopes = (requiredScopes: string[]): boolean => {
  const { scopes } = useAuth();
  if (!isAuthRequired) return true;
  return requiredScopes.some((s) => scopes.includes(s));
};

// ── useIsArchitect ───────────────────────────────────────────────────────────

/**
 * True when the current user has architect-level access.
 * Architects and admins can manage all analysis profiles;
 * migrators see only profiles attached to their applications' archetypes.
 */
export const useIsArchitect = (): boolean => {
  return useHasRealmRoles(["tackle-architect", "tackle-admin"]);
};
