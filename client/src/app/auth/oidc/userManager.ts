import { UserManager, WebStorageStateStore } from "oidc-client-ts";

import { ENV } from "@app/env";

/**
 * Create a single shared UserManager instance.  This handles token storage, refresh, and silent-renew.
 */
export const userManager = new UserManager({
  authority: "/oidc",
  client_id: ENV.OIDC_CLIENT_ID,
  redirect_uri: window.location.origin,
  post_logout_redirect_uri: window.location.origin,
  response_type: "code", // Authorization Code + PKCE (oidc-client-ts default for SPAs)
  scope: "openid profile email",
  userStore: new WebStorageStateStore({ store: window.sessionStorage }), // sessionStorage == new login for each tab

  // Automatically try a silent renew before expiry.
  automaticSilentRenew: true,
});

/**
 * For future use when account management is supported by the Hub OIDC provider.
 */
export const accountManagementUrl: string | undefined = undefined;
