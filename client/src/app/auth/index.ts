/**
 * Public barrel export for the auth module.
 *
 * Import from "@app/auth" — never from sub-files directly.
 */

export { AuthProvider } from "./AuthProvider";
export { useAuth, useHasAllScopes, useHasSomeScopes } from "./hooks";
export type { AuthState } from "./types";
