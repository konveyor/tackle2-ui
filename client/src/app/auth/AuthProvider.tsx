/**
 * The single authentication bootstrap component.
 *
 * Behavior:
 *  - AUTH_REQUIRED === true  → wraps children in AuthProvider from react-oidc-context.
 *                              On mount, if no session exists, automatically redirects
 *                              to OIDC provider (e.g. Keycloak) for login.
 *  - AUTH_REQUIRED !== true  → renders children directly; masquerade context is provided
 *                              via the same hook surface (useAuth, useHasRealmRoles, etc.)
 *                              so RBAC-gated components see synthetic roles from localStorage.
 *
 * Both paths publish an AuthStateContext so that hooks in hooks.ts can read auth
 * state without calling useOidcAuth() directly (which would throw when rendered
 * outside the OIDC provider tree).
 *
 * Axios interceptors are initialized only after the user is authenticated so that the
 * Bearer token is guaranteed to be present on the first API call.
 */

import { Suspense, createContext, useEffect } from "react";
import * as React from "react";
import { jwtDecode } from "jwt-decode";
import {
  AuthProvider as OidcAuthProvider,
  hasAuthParams,
  useAuth as useOidcAuth,
  useAutoSignin,
} from "react-oidc-context";

import { isAuthRequired } from "@app/Constants";
import { initInterceptors } from "@app/axios-config";
import { AppPlaceholder } from "@app/components/AppPlaceholder";

import { getMasqueradeRoles, getMasqueradeScopes } from "./masquerade";
import type { AuthState } from "./types";
import { accountManagementUrl, userManager } from "./userManager";

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Shared context populated by both NoAuthProvider (masquerade values) and
 * AuthReadyGate (live OIDC values).  hooks.ts reads from this context so
 * it never needs to call useOidcAuth() itself.
 */
export const AuthStateContext = createContext<AuthState | undefined>(undefined);

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

// ── Auth-disabled path ────────────────────────────────────────────────────────
// When auth is off, publish masquerade values.  RBAC hooks return masquerade roles.

const NoAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  useEffect(() => {
    initInterceptors();
  }, []);

  const authState: AuthState = {
    isLoaded: true,
    isAuthenticated: true,
    username: "developer",
    realmRoles: getMasqueradeRoles(),
    scopes: getMasqueradeScopes(),
    signIn: () => undefined,
    signOut: () => undefined,
    manageAccount: () => undefined,
  };

  return (
    <AuthStateContext.Provider value={authState}>
      <Suspense fallback={<AppPlaceholder />}>{children}</Suspense>
    </AuthStateContext.Provider>
  );
};

// ── Auth-enabled path ─────────────────────────────────────────────────────────
// Inner component: drives the OIDC sign-in flow and gates children on authentication.

const AuthReadyGate: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useOidcAuth();

  // Automatically redirect to Keycloak if not authenticated and no auth
  // params are present in the URL (i.e. we are not returning from a redirect).
  useAutoSignin();

  // Start interceptors only after a real authenticated session is available.
  useEffect(() => {
    if (auth.isAuthenticated) {
      initInterceptors();
    }
  }, [auth.isAuthenticated]);

  // Derive AuthState from the OIDC session for downstream hooks.
  const user = auth.user ?? null;
  const profile = user?.profile ?? null;
  const realmRoles = getRealmRolesFromAccessToken(user?.access_token);
  const scopes: string[] = user?.scope?.split(" ").filter(Boolean) ?? [];

  const authState: AuthState = {
    isLoaded: !auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    username:
      (profile?.preferred_username as string | undefined) ??
      profile?.sub ??
      "unknown",
    realmRoles,
    scopes,
    signIn: () => auth.signinRedirect(),
    signOut: () =>
      auth.signoutRedirect({
        post_logout_redirect_uri: window.location.origin,
      }),
    manageAccount: () =>
      window.open(accountManagementUrl, "_blank", "noopener"),
  };

  // Surface OIDC errors (e.g. failed signinCallback) immediately.
  // This check must precede the hasAuthParams() gate: if the callback
  // failed, the code/state params are never stripped from the URL, so
  // hasAuthParams() stays true and the user would be stuck on the
  // loading spinner forever.
  if (auth.error) {
    return (
      <AuthStateContext.Provider value={authState}>
        <div role="alert" style={{ padding: "2rem" }}>
          <strong>Authentication error:</strong> {auth.error.message}
        </div>
      </AuthStateContext.Provider>
    );
  }

  // Show the loading placeholder while:
  //  - the OIDC library is still initialising
  //  - we are processing the callback (code/state params in the URL)
  //  - we are not yet authenticated (about to redirect, or mid-redirect)
  if (auth.isLoading || hasAuthParams() || !auth.isAuthenticated) {
    return (
      <AuthStateContext.Provider value={authState}>
        <AppPlaceholder />
      </AuthStateContext.Provider>
    );
  }

  return (
    <AuthStateContext.Provider value={authState}>
      <Suspense fallback={<AppPlaceholder />}>{children}</Suspense>
    </AuthStateContext.Provider>
  );
};

const AuthEnabledProvider: React.FC<AuthProviderProps> = ({ children }) => (
  <OidcAuthProvider
    userManager={userManager}
    onSigninCallback={() => {
      // After the OIDC redirect-back, remove the code/state query params from the URL.
      window.history.replaceState({}, document.title, window.location.pathname);
    }}
  >
    <AuthReadyGate>{children}</AuthReadyGate>
  </OidcAuthProvider>
);

// ── Public export ─────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) =>
  isAuthRequired ? (
    <AuthEnabledProvider>{children}</AuthEnabledProvider>
  ) : (
    <NoAuthProvider>{children}</NoAuthProvider>
  );
