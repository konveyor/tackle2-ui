/**
 * NoAuthStrategy — production builds where AUTH_REQUIRED is false.
 *
 * Strategy contract: renders children inside AuthStateContext.Provider with a
 * fully-resolved AuthState. No OIDC provider, no masquerade logic, no
 * localStorage reads. Hardcodes admin-level access so every RBAC gate passes.
 *
 * Tree-shaking note: this file has zero dependency on masquerade.ts, so the
 * masquerade module (and its localStorage access) is never included in a
 * production no-auth bundle.
 */

import { Suspense, useEffect } from "react";
import * as React from "react";

import { initInterceptors } from "@app/axios-config";
import { AppPlaceholder } from "@app/components/AppPlaceholder";

import { AuthProviderProps, AuthStateContext } from "./AuthProvider";
import type { AuthState } from "./types";

const NO_AUTH_STATE: AuthState = {
  isLoaded: true,
  isAuthenticated: true,
  username: "admin",
  realmRoles: ["tackle-admin", "tackle-architect", "tackle-migrator"],
  scopes: [],
  signIn: () => undefined,
  signOut: () => undefined,
  manageAccount: () => undefined,
};

export const NoAuthStrategy: React.FC<AuthProviderProps> = ({ children }) => {
  useEffect(() => {
    initInterceptors();
  }, []);

  return (
    <AuthStateContext.Provider value={NO_AUTH_STATE}>
      <Suspense fallback={<AppPlaceholder />}>{children}</Suspense>
    </AuthStateContext.Provider>
  );
};
