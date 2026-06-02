import type { ComponentType } from "react";

/** Realm roles recognized by Tackle. */
export type TackleRealmRole =
  | "tackle-admin"
  | "tackle-architect"
  | "tackle-migrator";

/** The shape of auth state exposed to the rest of the application. */
export interface AuthState {
  /** True when the OIDC session is fully initialized (or auth is disabled). */
  isLoaded: boolean;
  /** True when a user is authenticated (always true when auth is disabled). */
  isAuthenticated: boolean;

  /** Preferred username from the ID token (or "developer" when auth is disabled). */
  username: string;
  /** Realm roles extracted from the access-token claim `realm_access.roles`. */
  realmRoles: string[];
  /** Space-separated scopes from the access-token `scope` claim, split into an array. */
  scopes: string[];
  /** When true, all scope checks pass regardless of the `scopes` array contents. */
  allScopesGranted: boolean;

  /** Sign in — redirects to the IdP. No-op when auth is disabled. */
  signIn: () => void;
  /** Sign out — ends the OIDC session. No-op when auth is disabled. */
  signOut: () => void;
  /** If set, opens the IdP account-management page. */
  manageAccount?: () => void;

  /** Strategy-specific toolbar content rendered in the masthead user area. */
  ToolbarContent: ComponentType | null;
}
