/**
 * Creates and exports a single shared UserManager instance (from oidc-client-ts).
 * The UserManager handles PKCE token storage, refresh, and silent-renew.
 *
 * OIDC authority is always the /oidc proxy path.ycloak path
 *
 * Client ID is always the OIDC_CLIENT_ID.
 */
import {
  UserManager,
  UserManagerSettings,
  WebStorageStateStore,
} from "oidc-client-ts";

import { ENV } from "@app/env";

const settings: UserManagerSettings = {
  authority: "/oidc",
  client_id: ENV.OIDC_CLIENT_ID,
  redirect_uri: window.location.origin,
  post_logout_redirect_uri: window.location.origin,
  response_type: "code", // Authorization Code + PKCE (oidc-client-ts default for SPAs)
  scope: "openid profile email",
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),

  // Automatically try a silent renew before expiry.
  automaticSilentRenew: true,
};

export const userManager = new UserManager(settings);

/**
 * For future use when account management is supported by the Hub OIDC provider.
 */
export const accountManagementUrl: string | undefined = undefined;
