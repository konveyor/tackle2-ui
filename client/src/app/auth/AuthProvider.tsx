/**
 * AuthProvider — facade that selects the appropriate auth strategy.
 *
 * Strategy selection:
 *   AUTH_REQUIRED === true              → OidcAuthStrategy       (live OIDC provider session)
 *   AUTH_REQUIRED !== true, dev build   → MasqueradeAuthStrategy (localStorage role switcher)
 *   AUTH_REQUIRED !== true, prod build  → NoAuthStrategy         (hardcoded admin roles)
 *
 * All three strategies publish AuthStateContext so that hooks in hooks.ts can
 * read auth state without calling useOidcAuth() directly.
 *
 * AuthStateContext and AuthProviderProps are defined here (not in a strategy
 * file) so that hooks.ts can import AuthStateContext without a circular
 * dependency, and strategy files can import AuthProviderProps from a single
 * source.
 */

import { createContext } from "react";
import * as React from "react";

import { isAuthRequired } from "@app/Constants";

import { MasqueradeAuthStrategy } from "./MasqueradeAuthStrategy";
import { NoAuthStrategy } from "./NoAuthStrategy";
import { OidcAuthStrategy } from "./OidcAuthStrategy";
import type { AuthState } from "./types";

export interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Shared context populated by whichever strategy is active.
 * hooks.ts reads from this context so it never calls useOidcAuth() directly.
 */
export const AuthStateContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  if (isAuthRequired) {
    return <OidcAuthStrategy>{children}</OidcAuthStrategy>;
  }
  if (process.env.NODE_ENV === "development") {
    return <MasqueradeAuthStrategy>{children}</MasqueradeAuthStrategy>;
  }
  return <NoAuthStrategy>{children}</NoAuthStrategy>;
};
