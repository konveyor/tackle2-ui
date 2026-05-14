/**
 * auth/masquerade.ts
 *
 * Masquerade support for development environments where AUTH_REQUIRED is false.
 *
 * Allows developers to exercise RBAC-gated UI without a live Keycloak instance
 * by providing synthetic realm roles and scopes through:
 *   1. Build-time environment variables (MASQUERADE_ROLES, MASQUERADE_SCOPES)
 *   2. Runtime localStorage overrides (gated so they cannot activate when auth is on)
 *
 * The localStorage key format is:
 *   tackle-masquerade-roles  → comma-separated role names
 *   tackle-masquerade-scopes → space-separated scope strings
 *
 * This module MUST NOT be imported in any code path that runs when AUTH_REQUIRED=true.
 * The AuthProvider enforces this at runtime.
 */

import { isAuthRequired } from "@app/Constants";

const LS_ROLES_KEY = "tackle-masquerade-roles";
const LS_SCOPES_KEY = "tackle-masquerade-scopes";

/** Available preset personas for the dev panel. */
export const MASQUERADE_PRESETS = {
  admin: {
    label: "Admin",
    roles: ["tackle-admin", "tackle-architect", "tackle-migrator"],
    scopes: [] as string[],
  },
  architect: {
    label: "Architect",
    roles: ["tackle-architect", "tackle-migrator"],
    scopes: [] as string[],
  },
  migrator: {
    label: "Migrator",
    roles: ["tackle-migrator"],
    scopes: [] as string[],
  },
} as const;

export type MasqueradePreset = keyof typeof MASQUERADE_PRESETS;

/**
 * Read the active masquerade roles.
 * Safety: returns [] if auth is required, so this can never leak into prod.
 * In production builds, localStorage overrides are also ignored — the build-time
 * env var or the admin default is always used, so stale dev-session values stored
 * in the browser cannot change the effective roles.
 */
export const getMasqueradeRoles = (): string[] => {
  if (isAuthRequired) return [];

  // 1. localStorage override — only in development builds.
  // process.env.NODE_ENV is replaced by webpack at build time, so this branch is
  // dead code in production bundles and the localStorage read never happens.
  if (process.env.NODE_ENV !== "production") {
    try {
      const lsRoles = window.localStorage.getItem(LS_ROLES_KEY);
      if (lsRoles)
        return lsRoles
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean);
    } catch {
      // localStorage unavailable (e.g. private browsing in some browsers)
    }
  }

  // 2. Build-time env var (webpack DefinePlugin injects MASQUERADE_ROLES)
  const envRoles =
    typeof process !== "undefined" && process.env.MASQUERADE_ROLES
      ? process.env.MASQUERADE_ROLES
      : "";
  if (envRoles)
    return envRoles
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

  // 3. Default: all roles (developer convenience)
  return MASQUERADE_PRESETS.admin.roles.slice();
};

/**
 * Read the active masquerade scopes.
 * Safety: returns [] if auth is required.
 * In production builds, localStorage overrides are ignored (same reason as roles).
 */
export const getMasqueradeScopes = (): string[] => {
  if (isAuthRequired) return [];

  if (process.env.NODE_ENV !== "production") {
    try {
      const lsScopes = window.localStorage.getItem(LS_SCOPES_KEY);
      if (lsScopes) return lsScopes.split(" ").filter(Boolean);
    } catch {
      // ignore
    }
  }

  const envScopes =
    typeof process !== "undefined" && process.env.MASQUERADE_SCOPES
      ? process.env.MASQUERADE_SCOPES
      : "";
  if (envScopes) return envScopes.split(" ").filter(Boolean);

  return [];
};

/** Persist a masquerade preset to localStorage. */
export const setMasqueradePreset = (preset: MasqueradePreset): void => {
  if (isAuthRequired) return; // safety guard
  const { roles } = MASQUERADE_PRESETS[preset];
  try {
    window.localStorage.setItem(LS_ROLES_KEY, roles.join(","));
    window.localStorage.removeItem(LS_SCOPES_KEY);
  } catch {
    // ignore
  }
};

/** Clear all masquerade overrides (reverts to env-var defaults). */
export const clearMasquerade = (): void => {
  try {
    window.localStorage.removeItem(LS_ROLES_KEY);
    window.localStorage.removeItem(LS_SCOPES_KEY);
  } catch {
    // ignore
  }
};

/** Return the current preset name that matches localStorage, or null. */
export const getCurrentPreset = (): MasqueradePreset | null => {
  try {
    const lsRoles = window.localStorage.getItem(LS_ROLES_KEY);
    if (!lsRoles) return "admin"; // default
    const roles = lsRoles
      .split(",")
      .map((r) => r.trim())
      .sort()
      .join(",");
    for (const [key, def] of Object.entries(MASQUERADE_PRESETS)) {
      if (def.roles.slice().sort().join(",") === roles) {
        return key as MasqueradePreset;
      }
    }
  } catch {
    // ignore
  }
  return null;
};
