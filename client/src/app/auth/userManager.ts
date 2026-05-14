/**
 * auth/userManager.ts
 *
 * Creates and exports a single shared UserManager instance (from oidc-client-ts).
 * The UserManager handles PKCE token storage, refresh, and silent-renew.
 *
 * OIDC authority is derived from the existing env vars so no operator changes
 * are required:
 *   authority = /auth/realms/{KEYCLOAK_REALM}
 *   client_id = KEYCLOAK_CLIENT_ID
 */
import {
  UserManager,
  UserManagerSettings,
  WebStorageStateStore,
} from "oidc-client-ts";

import { ENV } from "@app/env";

const realm = ENV.KEYCLOAK_REALM || "tackle";
const clientId = ENV.KEYCLOAK_CLIENT_ID || "tackle-ui";

const settings: UserManagerSettings = {
  authority: `/auth/realms/${realm}`,
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

/** URL of the IdP account-management page (Keycloak-specific). */
export const accountManagementUrl = `/auth/realms/${realm}/account`;
