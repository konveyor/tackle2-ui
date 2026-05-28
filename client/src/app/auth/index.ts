/**
 * Public barrel export for the auth module.
 *
 * Import from "@app/auth" — never from sub-files directly.
 */

export { AuthProvider } from "./AuthProvider";
export {
  useAuth,
  useHasRealmRoles,
  useHasScopes,
  useIsArchitect,
} from "./hooks";
export type { AuthState, TackleRealmRole } from "./types";
