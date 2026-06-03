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
 * Returns true when the current user has **at least one** of the supplied scopes.
 *
 * @example
 *   const canWrite = useHasSomeScopes(applicationsWriteScopes);
 */
export const useHasSomeScopes = (requiredScopes: string[]): boolean => {
  const { scopes, allScopesGranted } = useAuth();
  if (allScopesGranted) return true;
  return requiredScopes.some((s) => scopes.has(s));
};

/**
 * Returns true when the current user has **all** of the supplied scopes.
 *
 * @example
 *   const canManage = useHasAllScopes(["applications:put", "applications:delete"]);
 */
export const useHasAllScopes = (requiredScopes: string[]): boolean => {
  const { scopes, allScopesGranted } = useAuth();
  if (allScopesGranted) return true;
  return requiredScopes.every((s) => scopes.has(s));
};
