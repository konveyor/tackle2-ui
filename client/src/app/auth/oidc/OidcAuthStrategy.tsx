/**
 * Internal structure:
 *   OidcAuthStrategy  — outer shell, owns the OidcAuthProvider tree and the
 *                       onSigninCallback that strips code/state params from the URL.
 *   AuthReadyGate     — inner gate that reads the live OIDC session and drives
 *                       the error / loading / authenticated sub-states.
 */

import { Suspense, useMemo } from "react";
import * as React from "react";
import {
  AuthProvider as OidcAuthProvider,
  hasAuthParams,
  useAuth as useOidcAuth,
  useAutoSignin,
} from "react-oidc-context";

import { AppPlaceholder } from "@app/components/AppPlaceholder";

import { AuthProviderProps, AuthStateContext } from "../AuthProvider";
import type { AuthState } from "../types";

import { OidcToolbarItem } from "./OidcToolbarItem";
import { accountManagementUrl, userManager } from "./userManager";

/**
 * This gate is used to determine if the user is authenticated and to redirect
 * to the OIDC provider if not authenticated and no auth params are present in
 * the URL (i.e. we are not returning from a redirect).
 */
const AuthReadyGate: React.FC<AuthProviderProps> = ({ children }) => {
  const { isAuthenticated, isLoading, error } = useAutoSignin();

  const { user, signinRedirect, signoutRedirect } = useOidcAuth();

  const authState: AuthState = useMemo(() => {
    const profile = user?.profile ?? null;
    const scopes = new Set<string>(
      user?.scope?.split(" ").filter(Boolean) ?? []
    );

    return {
      isLoaded: !isLoading,
      isAuthenticated,
      username: profile?.preferred_username ?? profile?.sub ?? "unknown",
      scopes,
      allScopesGranted: false,

      signIn: () => signinRedirect(),
      signOut: () => signoutRedirect(),
      manageAccount: accountManagementUrl
        ? () => window.open(accountManagementUrl, "_blank", "noopener")
        : undefined,

      ToolbarContent: OidcToolbarItem,
    };
  }, [isLoading, isAuthenticated, user, signinRedirect, signoutRedirect]);

  // Surface OIDC errors (e.g. failed signinCallback) immediately.
  // This check must precede the hasAuthParams() gate: if the callback
  // failed, the code/state params are never stripped from the URL, so
  // hasAuthParams() stays true and the user would be stuck on the
  // loading spinner forever.
  if (error) {
    return (
      <AuthStateContext.Provider value={authState}>
        <div role="alert" style={{ padding: "2rem" }}>
          <strong>Authentication error:</strong> {error.message}
        </div>
      </AuthStateContext.Provider>
    );
  }

  // Show the loading placeholder while:
  //  - the OIDC library is still initializing
  //  - we are processing the callback (code/state params in the URL)
  //  - we are not yet authenticated (about to redirect, or mid-redirect)
  if (isLoading || hasAuthParams() || !isAuthenticated) {
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
