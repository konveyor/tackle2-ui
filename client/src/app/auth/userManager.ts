/**
 * Creates and exports a single shared UserManager instance (from oidc-client-ts).
 * The UserManager handles PKCE token storage, refresh, and silent-renew.
 *
 * OIDC authority is derived from env vars in priority order:
 *   1. OIDC_ISSUER (Hub built-in OIDC, e.g. https://host/oidc) — set by operator
 *   2. /auth/realms/{KEYCLOAK_REALM} — legacy Keycloak path
 *
 * Client ID priority:
 *   1. OIDC_CLIENT_ID (e.g. "web-ui") — set by operator
 *   2. KEYCLOAK_CLIENT_ID — legacy Keycloak client
 */
import {
  UserManager,
  UserManagerSettings,
  WebStorageStateStore,
} from "oidc-client-ts";

import { ENV } from "@app/env";

const keycloakRealm = ENV.KEYCLOAK_REALM || "tackle";
const clientId = ENV.OIDC_CLIENT_ID || ENV.KEYCLOAK_CLIENT_ID || "tackle-ui";

// When OIDC_ISSUER is set (Hub OIDC), derive the authority path from it so
// oidc-client-ts uses a relative URL and discovery works through the /oidc proxy.
// Fallback to the legacy Keycloak path when OIDC_ISSUER is not configured.
const authority = ENV.OIDC_ISSUER
  ? new URL(ENV.OIDC_ISSUER).pathname
  : `/auth/realms/${keycloakRealm}`;

const settings: UserManagerSettings = {
  authority,
  client_id: clientId,
  redirect_uri: window.location.origin,
  post_logout_redirect_uri: window.location.origin,
  response_type: "code", // Authorization Code + PKCE (oidc-client-ts default for SPAs)
  scope: "openid profile email",
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),

  // Automatically try a silent renew 60 s before expiry.
  automaticSilentRenew: true,
};

export const userManager = new UserManager(settings);

/**
 * URL of the IdP account-management page.
 * Only available for Keycloak-backed deployments; undefined when using Hub OIDC.
 */
export const accountManagementUrl: string | undefined = ENV.OIDC_ISSUER
  ? undefined
  : `/auth/realms/${keycloakRealm}/account`;
