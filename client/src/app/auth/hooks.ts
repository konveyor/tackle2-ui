/**
 * auth/hooks.ts
 *
 * The single public API for auth state and authorization checks in the application.
 *
 * All code that previously reached into `keycloak.tokenParsed` directly MUST
 * use these hooks instead. No feature code should import oidc-client-ts or
 * react-oidc-context directly.
 *
 * Hooks:
 *   useAuth()            — full auth state (isLoaded, isAuthenticated, username, signIn/Out…)
 *   useHasRealmRoles()   — true if the current user has ANY of the given roles
 *   useHasScopes()       — true if the current user has ANY of the given scopes
 *   useIsArchitect()     — true if the user is an architect or admin
 */

import { jwtDecode } from "jwt-decode";
import { useAuth as useOidcAuth } from "react-oidc-context";

import { isAuthRequired } from "@app/Constants";

import { getMasqueradeRoles, getMasqueradeScopes } from "./masquerade";
import { AuthState } from "./types";
import { accountManagementUrl, userManager } from "./userManager";

/**
 * Decode realm roles from an OIDC access token.
 *
 * Keycloak puts realm roles in the access token's `realm_access.roles` claim,
 * NOT in the ID token (`user.profile`). We must decode the access token JWT
 * ourselves to retrieve them.
 */
function getRealmRolesFromAccessToken(
  accessToken: string | undefined
): string[] {
  if (!accessToken) return [];
  try {
    const claims = jwtDecode<{ realm_access?: { roles?: string[] } }>(
      accessToken
    );
    return claims.realm_access?.roles ?? [];
  } catch {
    return [];
  }
}

// ── useAuth ───────────────────────────────────────────────────────────────────

/**
 * Returns the current auth state in a shape that abstracts over both the
 * auth-enabled (OIDC) and auth-disabled (masquerade) modes.
 *
 * All components should use this instead of reaching into oidc-client-ts directly.
 */
export const useAuth = (): AuthState => {
  // Always call the OIDC hook (Rules of Hooks) — it's a no-op when AuthProvider
  // is NoAuthProvider, but calling it conditionally would break hook ordering.
  const oidcAuth = useOidcAuth();

  if (!isAuthRequired) {
    // Auth-disabled: return masquerade values through the same shape.
    return {
      isLoaded: true,
      isAuthenticated: true,
      username: "developer",
      realmRoles: getMasqueradeRoles(),
      scopes: getMasqueradeScopes(),
      signIn: () => undefined,
      signOut: () => undefined,
      manageAccount: () => undefined,
    };
  }

  // Auth-enabled: derive state from the OIDC user object.
  const user = oidcAuth.user ?? null;
  const profile = user?.profile ?? null;

  // Keycloak puts realm roles in the ACCESS token, not the ID token.
  // user.profile is the parsed ID token — realm_access is absent there.
  // Decode the access token JWT directly to get the real roles.
  const realmRoles: string[] = getRealmRolesFromAccessToken(user?.access_token);

  const scopes: string[] = user?.scope?.split(" ").filter(Boolean) ?? [];

  return {
    isLoaded: !oidcAuth.isLoading,
    isAuthenticated: oidcAuth.isAuthenticated,
    username: profile?.preferred_username ?? profile?.sub ?? "unknown",
    realmRoles,
    scopes,
    signIn: () => userManager.signinRedirect(),
    signOut: () =>
      userManager.signoutRedirect({
        post_logout_redirect_uri: window.location.origin,
      }),
    manageAccount: () =>
      window.open(accountManagementUrl, "_blank", "noopener"),
  };
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
  if (!isAuthRequired) return true; // masquerade default — panel controls specifics
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
