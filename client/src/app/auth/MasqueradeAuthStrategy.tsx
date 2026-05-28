/**
 * MasqueradeAuthStrategy — development builds where AUTH_REQUIRED is false.
 *
 * Strategy contract: renders children inside AuthStateContext.Provider with a
 * fully-resolved AuthState. Reads roles and scopes from masquerade.ts, which
 * consults localStorage overrides and build-time env vars in that order,
 * defaulting to admin-level access.
 *
 * This strategy pairs with MasqueradeDevPanel in the toolbar: the dev panel
 * writes to localStorage and reloads the page, causing this provider to
 * re-read the updated roles on the next mount.
 *
 * This file is only ever selected when NODE_ENV !== "production", so it is
 * effectively dead code in production bundles.
 */

import { Suspense } from "react";
import * as React from "react";

import { AppPlaceholder } from "@app/components/AppPlaceholder";

import { AuthProviderProps, AuthStateContext } from "./AuthProvider";
import { getMasqueradeRoles, getMasqueradeScopes } from "./masquerade";
import type { AuthState } from "./types";

export const MasqueradeAuthStrategy: React.FC<AuthProviderProps> = ({
  children,
}) => {
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
