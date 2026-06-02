/**
 * Internal structure:
 *   OidcAuthStrategy  — outer shell, owns the OidcAuthProvider tree and the
 *                       onSigninCallback that strips code/state params from the URL.
 *   AuthReadyGate     — inner gate that reads the live OIDC session and drives
 *                       the error / loading / authenticated sub-states.
 */

import { Suspense, useEffect } from "react";
import * as React from "react";
import { jwtDecode } from "jwt-decode";
import {
  AuthProvider as OidcAuthProvider,
  hasAuthParams,
  useAuth as useOidcAuth,
  useAutoSignin,
} from "react-oidc-context";

import { initAuthInterceptors } from "@app/axios-config";
import { AppPlaceholder } from "@app/components/AppPlaceholder";

import { AuthProviderProps, AuthStateContext } from "./AuthProvider";
import { OidcToolbarItem } from "./OidcToolbarItem";
import type { AuthState } from "./types";
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

/**
 * This gate is used to determine if the user is authenticated and to redirect
 * to the OIDC provider if not authenticated and no auth params are present in
 * the URL (i.e. we are not returning from a redirect).
 *
 * It also starts the auth interceptors only after a real authenticated session
 * is available.
 */
const AuthReadyGate: React.FC<AuthProviderProps> = ({ children }) => {
  useAutoSignin();

  const auth = useOidcAuth();
  useEffect(() => {
    if (auth.isAuthenticated) {
      initAuthInterceptors();
    }
  }, [auth.isAuthenticated]);

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
    allScopesGranted: false,
    signIn: () => auth.signinRedirect(),
    signOut: () =>
      auth.signoutRedirect({
        post_logout_redirect_uri: window.location.origin,
      }),
    manageAccount: accountManagementUrl
      ? () => window.open(accountManagementUrl, "_blank", "noopener")
      : undefined,
    ToolbarContent: OidcToolbarItem,
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
  //  - the OIDC library is still initializing
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

/**
 * OidcAuthStrategy — auth-enabled path backed by an OIDC provider via react-oidc-context.
 *
 * Strategy contract: renders children inside AuthStateContext.Provider once a
 * real OIDC session is established. Shows AppPlaceholder while loading or
 * mid-redirect; surfaces an error banner on auth failure.
 */
export const OidcAuthStrategy: React.FC<AuthProviderProps> = ({ children }) => (
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
