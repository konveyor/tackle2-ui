/**
 * Public barrel export for the auth module.
 *
 * Import from "@app/auth" — never from sub-files directly.
 */

export { AuthProvider } from "./AuthProvider";
export { MasqueradeDevPanel } from "./MasqueradeDevPanel";
export {
  useAuth,
  useHasRealmRoles,
  useHasScopes,
  useIsArchitect,
} from "./hooks";
export type { AuthState, TackleRealmRole } from "./types";
export {
  MASQUERADE_PRESETS,
  clearMasquerade,
  getCurrentPreset,
  getMasqueradeRoles,
  getMasqueradeScopes,
  setMasqueradePreset,
} from "./masquerade";
