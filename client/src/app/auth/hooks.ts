import { useContext } from "react";

import { AuthStateContext } from "./AuthProvider";
import type { AuthState } from "./types";

/**
 * Returns the current auth state in a shape that abstracts over all auth strategies.
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

/**
 * Returns true when the current user has at least one of the supplied realm roles.
 *
 * @example
 *   const canAdmin = useHasRealmRoles(["tackle-admin"]);
 */
export const useHasRealmRoles = (roles: string[]): boolean => {
  const { realmRoles } = useAuth();
  return roles.some((r) => realmRoles.includes(r));
};

/**
 * Returns true when the current user has at least one of the supplied scopes.
 *
 * @example
 *   const canWrite = useHasScopes(applicationsWriteScopes);
 */
export const useHasScopes = (requiredScopes: string[]): boolean => {
  const { scopes, allScopesGranted } = useAuth();
  if (allScopesGranted) return true;
  return requiredScopes.some((s) => scopes.includes(s));
};

/**
 * Is the user in the architect or admin role?
 */
export const useIsArchitect = (): boolean => {
  return useHasRealmRoles(["tackle-architect", "tackle-admin"]);
};
