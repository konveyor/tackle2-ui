import {
  Suspense,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import * as React from "react";

import { AppPlaceholder } from "@app/components/AppPlaceholder";

import { AuthProviderProps, AuthStateContext } from "./AuthProvider";
import { MasqueradeDevPanel } from "./MasqueradeDevPanel";
import {
  MASQUERADE_PRESETS,
  MasqueradePreset,
  getMasqueradeRoles,
  getMasqueradeScopes,
  setMasqueradePreset,
} from "./masquerade";
import type { AuthState } from "./types";

type MasqueradeDispatchFn = (preset: MasqueradePreset) => void;

const MasqueradeDispatchContext = createContext<
  MasqueradeDispatchFn | undefined
>(undefined);

/**
 * Switch the active masquerade persona. Persists to localStorage and updates
 * React state so every auth-context consumer re-renders immediately.
 */
export const useMasqueradeDispatch = (): MasqueradeDispatchFn => {
  const dispatch = useContext(MasqueradeDispatchContext);
  if (!dispatch) {
    throw new Error(
      "useMasqueradeDispatch() must be used within <MasqueradeAuthStrategy>."
    );
  }
  return dispatch;
};

/**
 * Auth strategy for development builds where AUTH_REQUIRED is false.
 *
 * :important: Note: Masquerade only applies to UI code and is not used for API requests.
 * With auth disabled, all API requests are understood by the backend as being made with
 * the admin role.
 *
 * Strategy contract: renders children inside AuthStateContext.Provider with a
 * fully-resolved AuthState. Reads roles and scopes from masquerade.ts, which
 * consults localStorage overrides and build-time env vars in that order,
 * defaulting to admin-level access.
 *
 * This strategy provides MasqueradeDevPanel as its ToolbarContent. The dev
 * panel calls the dispatch function from MasqueradeDispatchContext to switch
 * personas. Because roles/scopes are held in React state, all context
 * consumers (useAuth, useHasRealmRoles, etc.) re-render automatically —
 * no page reload required.
 *
 * Since the MasqueradeAuthStrategy is only selected when NODE_ENV !== "production", this
 * file is tree-shaken from production bundles.
 */
export const MasqueradeAuthStrategy: React.FC<AuthProviderProps> = ({
  children,
}) => {
  const [roles, setRoles] = useState(getMasqueradeRoles);
  const [scopes, setScopes] = useState(getMasqueradeScopes);

  const switchPreset = useCallback((preset: MasqueradePreset) => {
    setMasqueradePreset(preset);
    setRoles(MASQUERADE_PRESETS[preset].roles.slice());
    setScopes(MASQUERADE_PRESETS[preset].scopes.slice());
  }, []);

  const authState: AuthState = useMemo(
    () => ({
      isLoaded: true,
      isAuthenticated: true,
      username: "developer",
      realmRoles: roles,
      scopes,
      allScopesGranted: false,
      signIn: () => undefined,
      signOut: () => undefined,
      manageAccount: () => undefined,
      ToolbarContent: MasqueradeDevPanel,
    }),
    [roles, scopes]
  );

  return (
    <MasqueradeDispatchContext.Provider value={switchPreset}>
      <AuthStateContext.Provider value={authState}>
        <Suspense fallback={<AppPlaceholder />}>{children}</Suspense>
      </AuthStateContext.Provider>
    </MasqueradeDispatchContext.Provider>
  );
};
