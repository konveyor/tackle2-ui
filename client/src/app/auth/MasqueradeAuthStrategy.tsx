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
  getCurrentPreset,
  setCurrentPreset,
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
 */
export const MasqueradeAuthStrategy: React.FC<AuthProviderProps> = ({
  children,
}) => {
  const [preset, setPreset] = useState<MasqueradePreset>(getCurrentPreset);

  const switchPreset = useCallback((next: MasqueradePreset) => {
    setCurrentPreset(next);
    setPreset(next);
  }, []);

  const authState: AuthState = useMemo(() => {
    const { scopes, allScopesGranted } = MASQUERADE_PRESETS[preset];

    return {
      isLoaded: true,
      isAuthenticated: true,
      username: "developer",
      scopes: new Set(scopes),
      allScopesGranted,
      signIn: () => undefined,
      signOut: () => undefined,
      manageAccount: undefined,
      ToolbarContent: MasqueradeDevPanel,
    };
  }, [preset]);

  return (
    <MasqueradeDispatchContext.Provider value={switchPreset}>
      <AuthStateContext.Provider value={authState}>
        <Suspense fallback={<AppPlaceholder />}>{children}</Suspense>
      </AuthStateContext.Provider>
    </MasqueradeDispatchContext.Provider>
  );
};
