/**
 * auth/AuthProvider.tsx
 *
 * Replaces KeycloakProvider.tsx as the single authentication bootstrap component.
 *
 * Behaviour:
 *  - AUTH_REQUIRED === true  → wraps children in AuthProvider from react-oidc-context.
 *                              On mount, if no session exists, automatically redirects
 *                              to Keycloak for login (mirrors the old `onLoad: "login-required"`
 *                              behaviour from @react-keycloak/web).
 *  - AUTH_REQUIRED !== true  → renders children directly; masquerade context is provided
 *                              via the same hook surface (useAuth, useHasRealmRoles, etc.)
 *                              so RBAC-gated components see synthetic roles from localStorage.
 *
 * Axios interceptors are initialised only after the user is authenticated so that the
 * Bearer token is guaranteed to be present on the first API call.
 */

import { Suspense, useEffect } from "react";
import * as React from "react";
import {
  AuthProvider as OidcAuthProvider,
  hasAuthParams,
  useAuth as useOidcAuth,
  useAutoSignin,
} from "react-oidc-context";

import { isAuthRequired } from "@app/Constants";
import { initInterceptors } from "@app/axios-config";
import { AppPlaceholder } from "@app/components/AppPlaceholder";

import { userManager } from "./userManager";

interface AuthProviderProps {
  children: React.ReactNode;
}

// ── Auth-disabled path ────────────────────────────────────────────────────────
// When auth is off, render children directly. RBAC hooks return masquerade values.

const NoAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Still need interceptors for API calls (no Bearer token will be attached,
  // but the response-side 401 handler is still useful in mixed environments).
  useEffect(() => {
    initInterceptors();
  }, []);

  return <Suspense fallback={<AppPlaceholder />}>{children}</Suspense>;
};

// ── Auth-enabled path ─────────────────────────────────────────────────────────
// Inner component: drives the OIDC sign-in flow and gates children on authentication.

const AuthReadyGate: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useOidcAuth();

  // Automatically redirect to Keycloak if not authenticated and no auth
  // params are present in the URL (i.e. we are not returning from a redirect).
  // useAutoSignin calls signinRedirect() exactly once and guards against
  // double-calls via an internal hasTriedSignin flag.
  useAutoSignin();

  // Start interceptors only after a real authenticated session is available.
  // This ensures the Bearer token is present for the first API call.
  useEffect(() => {
    if (auth.isAuthenticated) {
      initInterceptors();
    }
  }, [auth.isAuthenticated]);

  // Show the loading placeholder while:
  //  - the OIDC library is still initialising
  //  - we are processing the callback (code/state params in the URL)
  //  - we are not yet authenticated (about to redirect, or mid-redirect)
  if (auth.isLoading || hasAuthParams() || !auth.isAuthenticated) {
    return <AppPlaceholder />;
  }

  if (auth.error) {
    // Surface auth errors rather than silently hanging.
    return (
      <div role="alert" style={{ padding: "2rem" }}>
        <strong>Authentication error:</strong> {auth.error.message}
      </div>
    );
  }

  return <Suspense fallback={<AppPlaceholder />}>{children}</Suspense>;
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
