/**
 * Masquerade preset management for development environments where
 * AUTH_REQUIRED is false.
 *
 * The selected preset is persisted in localStorage. On first load (no key
 * present), "noAuth" is used as the default — giving full access with no
 * role constraints. Roles and scopes flow out via the MasqueradeAuthStrategy.
 */

import { isAuthRequired } from "@app/Constants";

const LS_PRESET_KEY = "tackle-masquerade-preset";

/** Available preset personas for the dev panel. */
export const MASQUERADE_PRESETS = {
  noAuth: {
    label: "No Auth",
    roles: [] as string[],
    scopes: [] as string[],
    allScopesGranted: true,
  },
  admin: {
    label: "Admin",
    roles: ["tackle-admin", "tackle-architect", "tackle-migrator"],
    scopes: [] as string[],
    allScopesGranted: false,
  },
  architect: {
    label: "Architect",
    roles: ["tackle-architect", "tackle-migrator"],
    scopes: [] as string[],
    allScopesGranted: false,
  },
  migrator: {
    label: "Migrator",
    roles: ["tackle-migrator"],
    scopes: [] as string[],
    allScopesGranted: false,
  },
} as const;

export type MasqueradePreset = keyof typeof MASQUERADE_PRESETS;

const DEFAULT_PRESET: MasqueradePreset = "noAuth";

/** Read the currently-selected preset from localStorage (defaults to noAuth). */
export const getCurrentPreset = (): MasqueradePreset => {
  if (isAuthRequired) return DEFAULT_PRESET;

  try {
    const stored = window.localStorage.getItem(LS_PRESET_KEY);
    if (stored && Object.hasOwn(MASQUERADE_PRESETS, stored)) {
      return stored as MasqueradePreset;
    }
  } catch {
    // localStorage unavailable
  }

  // No key present — initialize with the default.
  setCurrentPreset(DEFAULT_PRESET);
  return DEFAULT_PRESET;
};

/** Persist the selected preset to localStorage. */
export const setCurrentPreset = (preset: MasqueradePreset): void => {
  if (isAuthRequired) return;
  try {
    window.localStorage.setItem(LS_PRESET_KEY, preset);
  } catch {
    // ignore
  }
};
