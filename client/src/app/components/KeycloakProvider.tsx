/**
 * KeycloakProvider.tsx — re-exports AuthProvider for backwards compatibility.
 *
 * This file exists only to avoid touching any import sites that reference
 * "@app/components/KeycloakProvider" directly. New code should import
 * AuthProvider from "@app/auth" instead.
 *
 * @deprecated Import from "@app/auth" directly.
 */
export { AuthProvider as KeycloakProvider } from "@app/auth";
