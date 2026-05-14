/**
 * auth/AuthProvider.tsx
 *
 * Replaces KeycloakProvider.tsx as the single authentication bootstrap component.
 *
 * Behaviour:
 *  - AUTH_REQUIRED === true  → wraps children in AuthProvider from react-oidc-context,
 *                              which redirects to Keycloak for login on mount.
 *  - AUTH_REQUIRED !== true  → renders children directly; masquerade context is provided
 *                              via the same hook surface (useAuth, useHasRealmRoles, etc.)
 *                              so RBAC-gated components see synthetic roles from localStorage.
 *
 * Axios interceptors are initialised inside the auth-enabled path so they run only
 * once the OIDC session is ready.
 */

import { Suspense, useEffect } from "react";
import * as React from "react";
import {
  AuthProvider as OidcAuthProvider,
  useAuth as useOidcAuth,
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
// Inner component: starts interceptors after the OIDC session is ready.

const AuthReadyGate: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useOidcAuth();

  useEffect(() => {
    if (!auth.isLoading) {
      initInterceptors();
    }
  }, [auth.isLoading]);

  if (auth.isLoading) {
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
    // Automatically redirect to Keycloak if not signed in.
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
